import { Injectable, NotFoundException, ForbiddenException, BadRequestException, } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { AuditLogService } from '../audit-log/audit-log.service'
import { CreateGradeLockSettingDto } from './dto/grade-lock.dto'
import { GradeLockValidator } from './grade-lock.validator'

@Injectable()
export class GradeLockService {
  constructor(
    private readonly db: DatabaseService,
    private readonly auditLog: AuditLogService,
    private readonly validator: GradeLockValidator,
  ) {}

  /**
   * Create or update lock deadline setting for a school year
   */
  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    const schoolYear = await this.db.schoolYear.findUnique({
      where: { id: dto.schoolYearId },
    })

    if (!schoolYear) {
      throw new NotFoundException('School year not found')
    }

    const lockDeadline = new Date(dto.lockDeadline)
    const now = new Date()

    if (lockDeadline < now) {
      throw new BadRequestException('Lock deadline cannot be in the past')
    }

    const setting = await this.db.gradeLockSetting.upsert({
      where: {
        org_id_school_year_id: {
          org_id: orgId,
          school_year_id: dto.schoolYearId,
        },
      },
      update: {
        lock_deadline: lockDeadline,
        updated_at: new Date(),
      },
      create: {
        org_id: orgId,
        school_year_id: dto.schoolYearId,
        lock_deadline: lockDeadline,
      },
    })

    await this.auditLog.logAdminAction({
      orgId,
      actorId: 'system',
      action: 'GRADE_LOCK_DEADLINE_SET',
      entityType: 'GRADE_LOCK_SETTING',
      entityId: setting.id,
      metadata: {
        schoolYearId: dto.schoolYearId,
        deadline: lockDeadline.toISOString(),
      },
    })

    return setting
  }

  /**
   * Get lock deadline setting for a school year
   */
  async getSetting(orgId: string, schoolYearId: string) {
    const setting = await this.db.gradeLockSetting.findUnique({
      where: {
        org_id_school_year_id: {
          org_id: orgId,
          school_year_id: schoolYearId,
        },
      },
    })

    if (!setting) {
      return null // No deadline set yet
    }

    return setting
  }

  /**
   * Lock a class (educator action)
   */
  async lockClass(
    classId: string,
    userId: string,
    orgId: string,
  ) {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
    })

    if (!cls) {
      throw new NotFoundException('Class not found')
    }

    if (cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class')
    }

    const lockSetting = await this.db.gradeLockSetting.findUnique({
      where: {
        org_id_school_year_id: {
          org_id: orgId,
          school_year_id: cls.school_year_id,
        },
      },
    })

    const now = new Date()

    if (lockSetting && now > lockSetting.lock_deadline) {
      throw new ForbiddenException(
        `Cannot lock class after deadline (${lockSetting.lock_deadline.toISOString()})`
      )
    }

    const gradeLock = await this.db.gradeLock.upsert({
      where: { class_id: classId },
      update: {
        is_locked: true,
        locked_by: userId,
        locked_at: now,
      },
      create: {
        org_id: orgId,
        class_id: classId,
        is_locked: true,
        locked_by: userId,
        locked_at: now,
      },
    })

    await this.lockGradingScaleForClass(classId, orgId)

    await this.auditLog.logAdminAction({
      orgId,
      actorId: userId,
      action: 'EDUCATOR_CLASS_LOCK',
      entityType: 'CLASS',
      entityId: classId,
      metadata: {
        lockedAt: now.toISOString(),
      },
    })

    return { success: true, gradeLock }
  }

  /**
   * Unlock a class (educator or admin action)
   */
  async unlockClass(
    classId: string,
    userId: string,
    userRole: string,
    orgId: string,
  ) {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
    })

    if (!cls) {
      throw new NotFoundException('Class not found')
    }

    if (userRole !== 'admin' && cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class')
    }

    if (userRole !== 'admin') {
      const lockSetting = await this.db.gradeLockSetting.findUnique({
        where: {
          org_id_school_year_id: {
            org_id: orgId,
            school_year_id: cls.school_year_id,
          },
        },
      })

      const now = new Date()

      if (lockSetting && now > lockSetting.lock_deadline) {
        throw new ForbiddenException(
          `Cannot unlock class after deadline. Contact administrator.`
        )
      }
    }

    const lock = await this.db.gradeLock.findUnique({
      where: { class_id: classId },
    })

    if (!lock || !lock.is_locked) {
      throw new BadRequestException('Class is not locked')
    }

    const now = new Date()

    const updatedLock = await this.db.gradeLock.update({
      where: { class_id: classId },
      data: {
        is_locked: false,
        locked_by: null,
        locked_at: null,
      },
    })

    const action =
      userRole === 'admin'
        ? 'ADMIN_CLASS_UNLOCK_OVERRIDE'
        : 'EDUCATOR_CLASS_UNLOCK'

    await this.auditLog.logAdminAction({
      orgId,
      actorId: userId,
      action,
      entityType: 'CLASS',
      entityId: classId,
      metadata: {
        unlockedAt: now.toISOString(),
        userRole,
      },
    })

    return { success: true, gradeLock: updatedLock }
  }

  /**
   * Get all class locks for organization
   */
  async getClassLocks(orgId: string) {
    const classes = await this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
      },
      select: {
        id: true,
        subject_id: true,
        educator_id: true,
        school_year_id: true,
        subject: {
          include: {
            program: { select: { id: true, name: true } },
            course: { select: { id: true, name: true } },
            strand: { select: { id: true, name: true } },
            level: { select: { id: true, name: true } },
          },
        },
        gradeLock: true,
      },
      orderBy: { created_at: 'desc' },
    })

    const educatorIds = [...new Set(classes.map((c) => c.educator_id))]
    const educators = await this.db.profile.findMany({
      where: {
        account_id: { in: educatorIds },
      },
      select: {
        account_id: true,
        full_name: true,
      },
    })

    const educatorMap = new Map(
      educators.map((e) => [e.account_id, e.full_name || 'Unknown Educator'])
    )

    return classes.map((cls) =>
      this.mapClassToGradeLock(cls, orgId, educatorMap)
    )
  }

  /**
   * Get class locks filtered by school year
   */
async getClassLocksBySchoolYear(orgId: string, schoolYearId: string) {
  const classes = await this.db.class.findMany({
    where: {
      org_id: orgId,
      school_year_id: schoolYearId,
      deleted_at: null,
    },
    select: {
      id: true,
      subject_id: true,
      educator_id: true,
      school_year_id: true,
      subject: {
        include: {
          program: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
          strand: { select: { id: true, name: true } },
          level: { select: { id: true, name: true } },
        },
      },
      gradeLock: true,
    },
    orderBy: { created_at: 'desc' },
  })

  const educatorIds = [...new Set(classes.map((c) => c.educator_id))]
  const educators = await this.db.profile.findMany({
    where: {
      account_id: { in: educatorIds },
    },
    select: {
      account_id: true,
      full_name: true,
    },
  })

  const educatorMap = new Map(
    educators.map((e) => [e.account_id, e.full_name || 'Unknown Educator'])
  )

  return classes.map((cls) =>
    this.mapClassToGradeLock(cls, orgId, educatorMap)
  )
}

  /**
   * Auto-lock classes after deadline
   */
  async autoLockExpiredClasses(orgId: string) {
    const now = new Date()

    const expiredSettings = await this.db.gradeLockSetting.findMany({
      where: {
        org_id: orgId,
        lock_deadline: {
          lte: now,
        },
      },
    })

    for (const setting of expiredSettings) {
      const classes = await this.db.class.findMany({
        where: {
          school_year_id: setting.school_year_id,
        },
      })

      for (const cls of classes) {
        const existingLock = await this.db.gradeLock.findUnique({
          where: {
            class_id: cls.id,
          },
        })

        if (!existingLock?.is_locked) {
          await this.db.gradeLock.upsert({
            where: {
              class_id: cls.id,
            },
            update: {
              is_locked: true,
              locked_by: 'system',
              locked_at: now,
            },
            create: {
              org_id: orgId,
              class_id: cls.id,
              is_locked: true,
              locked_by: 'system',
              locked_at: now,
            },
          })

          await this.auditLog.logAdminAction({
            orgId,
            actorId: 'system',
            action: 'AUTO_GRADE_LOCK_DEADLINE',
            entityType: 'CLASS',
            entityId: cls.id,
            metadata: {
              schoolYearId: setting.school_year_id,
              autoLockedAt: now.toISOString(),
            },
          })
        }
      }
    }

    return { success: true, lockedCount: expiredSettings.length }
  }

  /**
   * Lock grading scales when a class is locked
   */
  private async lockGradingScaleForClass(classId: string, orgId: string) {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: {
        subject: {
          select: {
            level_id: true,
          },
        },
      },
    })

    if (!cls?.subject?.level_id) {
      return // No level associated
    }

    const level = await this.db.level.findUnique({
      where: { id: cls.subject.level_id },
      select: {
        program_id: true,
        school_year_id: true,
      },
    })

    if (!level) {
      return
    }

    await this.db.gradingScale.updateMany({
      where: {
        org_id: orgId,
        program_id: level.program_id,
        school_year_id: level.school_year_id,
        is_locked: false,
      },
      data: {
        is_locked: true,
        locked_at: new Date(),
      },
    })
  }

  /**
   * Map class data to GradeLock response format
   * Enriches with educator name and subject name for table display
   */
  private mapClassToGradeLock(
    cls: any,
    orgId: string,
    educatorMap: Map<string, string>
  ) {
    const educatorName = educatorMap.get(cls.educator_id) || 'Unknown Educator'
    const subjectName = cls.subject?.name || 'Unknown Subject'
    const lockStatus = cls.gradeLock?.is_locked
      ? 'locked'
      : cls.gradeLock?.locked_by === 'system'
        ? 'auto_locked'
        : 'unlocked'

    return {
      id: cls.gradeLock?.id ?? cls.id,
      org_id: orgId,
      class_id: cls.id,
      is_locked: cls.gradeLock?.is_locked ?? false,
      locked_by: cls.gradeLock?.locked_by ?? null,
      locked_at: cls.gradeLock?.locked_at ?? null,
      created_at: cls.gradeLock?.created_at ?? cls.created_at,
      // Flat fields for table display (column accessors)
      className: subjectName,
      educatorName,
      semesterName: 'TBD', // TODO: fetch from semester table if needed
      termName: 'TBD', // TODO: fetch from term table if needed
      lockStatus,
      deadline: null, // TODO: fetch from lock settings
      // Original nested structure for filters
      class: {
        id: cls.id,
        subject_id: cls.subject_id,
        educator_id: cls.educator_id,
        school_year_id: cls.school_year_id,
        subject: cls.subject
          ? {
              id: cls.subject.id,
              name: cls.subject.name,
              program: cls.subject.program ?? null,
              course: cls.subject.course ?? null,
              strand: cls.subject.strand ?? null,
              level: cls.subject.level ?? null,
            }
          : null,
      },
    }
  }
}
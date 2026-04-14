// ===== File: backend/src/modules/grade-lock/grade-lock.service.ts =====

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '@/core/database/database.provider'
import { AuditLogService } from '../audit-log/audit-log.service'
import { CreateGradeLockSettingDto } from './dto/grade-lock.dto'
import { GradeLockValidator } from './grade-lock.validator'

@Injectable()
export class GradeLockService {
  constructor(
    private readonly db: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly validator: GradeLockValidator,
  ) {}

  /**
   * ADMIN: Create or update lock deadline for a school year
   */
  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    // Validate school year exists
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
      actorId: 'system', // or pass from user
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
   * ADMIN/EDUCATOR: Get lock setting for a school year
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
   * EDUCATOR: Manually lock their class (before deadline)
   * Rules:
   * - Can only lock BEFORE deadline
   * - Can only lock their own class
   */
  async lockClass(
    classId: string,
    userId: string,
    orgId: string,
  ) {
    // ===== STEP 1: Validate class exists and belongs to educator =====
    const cls = await this.db.class.findUnique({
      where: { id: classId },
    })

    if (!cls) {
      throw new NotFoundException('Class not found')
    }

    if (cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class')
    }

    // ===== STEP 2: Check deadline =====
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

    // ===== STEP 3: Update/Create GradeLock =====
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

    // ===== STEP 4: Lock the grading scale for this class's level =====
    await this.lockGradingScaleForClass(classId, orgId)

    // ===== STEP 5: Audit log =====
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
   * EDUCATOR: Unlock their class (before deadline only)
   * ADMIN: Can unlock anytime (override)
   */
  async unlockClass(
    classId: string,
    userId: string,
    userRole: string,
    orgId: string,
  ) {
    // ===== STEP 1: Validate class exists =====
    const cls = await this.db.class.findUnique({
      where: { id: classId },
    })

    if (!cls) {
      throw new NotFoundException('Class not found')
    }

    // ===== STEP 2: Check permissions =====
    if (userRole !== 'admin' && cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class')
    }

    // ===== STEP 3: Educators cannot unlock after deadline =====
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

    // ===== STEP 4: Check if locked =====
    const lock = await this.db.gradeLock.findUnique({
      where: { class_id: classId },
    })

    if (!lock || !lock.is_locked) {
      throw new BadRequestException('Class is not locked')
    }

    // ===== STEP 5: Unlock =====
    const now = new Date()
    const updatedLock = await this.db.gradeLock.update({
      where: { class_id: classId },
      data: {
        is_locked: false,
        locked_by: null,
        locked_at: null,
      },
    })

    // ===== STEP 6: Audit log =====
    const action = userRole === 'admin'
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
   * INTERNAL: Get all class locks for admin dashboard
   */
  async getClassLocks(orgId: string) {
    return this.db.gradeLock.findMany({
      where: { org_id: orgId },
      include: {
        class: {
          select: {
            id: true,
            subject_id: true,
            educator_id: true,
            school_year_id: true,
          },
        },
      },
      orderBy: { locked_at: 'desc' },
    })
  }

  /**
   * INTERNAL: Auto-lock classes when deadline passes (can be called by scheduler if needed, but NOT required)
   * We don't use cron - instead we check deadline dynamically in canEditGrades()
   */
  async autoLockExpiredClasses(orgId: string) {
    const now = new Date()

    // Find all expired lock settings
    const expiredSettings = await this.db.gradeLockSetting.findMany({
      where: {
        org_id: orgId,
        lock_deadline: { lte: now },
      },
    })

    for (const setting of expiredSettings) {
      // Get all classes in this school year
      const classes = await this.db.class.findMany({
        where: { school_year_id: setting.school_year_id },
      })

      for (const cls of classes) {
        const existingLock = await this.db.gradeLock.findUnique({
          where: { class_id: cls.id },
        })

        // Only auto-lock if not already locked
        if (!existingLock?.is_locked) {
          await this.db.gradeLock.upsert({
            where: { class_id: cls.id },
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

    return { success: true, lockedCount: classes.length }
  }

  /**
   * INTERNAL: Lock grading scale for a class's level
   */
  private async lockGradingScaleForClass(classId: string, orgId: string) {
    // Get class -> subject -> level
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

    // Now find grading scales for this level's program
    const level = await this.db.level.findUnique({
      where: { id: cls.subject.level_id },
      select: { program_id: true, school_year_id: true },
    })

    if (!level) {
      return
    }

    // Lock grading scale for this program + school year
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
}
// @/modules/grade-lock/grade-lock.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'
import {
  CreateGradeLockSettingDto,
  UpdateGradeLockSettingDto,
  AssignSettingDto,
  LockClassDto,
  UnlockClassDto,
  OverrideGradeLockDto,
} from './dto/grade-lock.dto'
import { AuditLogService } from '../audit-log/audit-log.service'

@Injectable()
export class GradeLockService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly auditLogService: AuditLogService,  // ← INJECTED
  ) {}

  // ─── Settings ──────────────────────────────────────────────────────────────

  async createSetting(orgId: string, dto: CreateGradeLockSettingDto) {
    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId)
    }

    return this.repo.createSetting(orgId, {
      name: dto.name,
      description: dto.description,
      lockType: dto.lockType,
      lock_deadline: dto.lock_deadline ? new Date(dto.lock_deadline) : null,
      deadlineDays: dto.deadlineDays ?? null,
      allowOverride: dto.allowOverride,
      is_default: dto.is_default ?? false,
    })
  }

  async getSettings(orgId: string) {
    const settings = await this.repo.findAllSettings(orgId)
    return settings.map((s) => ({
      ...s,
      used_in_classes: s._count.gradeLocks,
      _count: undefined,
    }))
  }

  async getSetting(orgId: string, settingId: string) {
    const setting = await this.repo.findSettingById(orgId, settingId)
    if (!setting) throw new NotFoundException('Grade lock setting not found')
    return { ...setting, used_in_classes: setting._count.gradeLocks, _count: undefined }
  }

  async updateSetting(orgId: string, settingId: string, dto: UpdateGradeLockSettingDto) {
    await this.getSetting(orgId, settingId)

    if (dto.is_default) {
      await this.repo.clearDefaultSettings(orgId, settingId)
    }

    return this.repo.updateSetting(settingId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.lockType !== undefined && { lockType: dto.lockType }),
      ...(dto.lock_deadline !== undefined && {
        lock_deadline: dto.lock_deadline ? new Date(dto.lock_deadline) : null,
      }),
      ...(dto.deadlineDays !== undefined && { deadlineDays: dto.deadlineDays }),
      ...(dto.allowOverride !== undefined && { allowOverride: dto.allowOverride }),
      ...(dto.is_default !== undefined && { is_default: dto.is_default }),
    })
  }

  async deleteSetting(orgId: string, settingId: string) {
    await this.getSetting(orgId, settingId)

    const activeCount = await this.repo.countActiveLocksForSetting(orgId, settingId)
    if (activeCount > 0) {
      throw new ConflictException(
        `Cannot delete: ${activeCount} class(es) are currently locked with this setting`,
      )
    }

    await this.repo.deleteLocksForSetting(orgId, settingId)
    await this.repo.deleteSetting(settingId)

    return { success: true }
  }

  // ─── Assignment ────────────────────────────────────────────────────────────

  async assignSetting(orgId: string, actorId: string, dto: AssignSettingDto) {
    const [cls, setting] = await Promise.all([
      this.repo.findClassById(dto.class_id),
      this.repo.findSettingById(orgId, dto.setting_id),
    ])

    if (!cls || cls.deleted_at) throw new NotFoundException('Class not found')
    if (!setting) throw new NotFoundException('Grade lock setting not found')

    const existing = await this.repo.findLockByClassId(dto.class_id)
    if (existing?.is_locked) {
      throw new ForbiddenException('Cannot reassign setting: class is currently locked')
    }

    const gradeLock = await this.repo.upsertLock(orgId, dto.class_id, dto.setting_id)

    await this.repo.createEvent({
      org_id: orgId,
      class_id: dto.class_id,
      actor_id: actorId,
      type: 'request',
      reason: 'Setting assigned',
    })

    return gradeLock
  }

  async autoAssignOnClassCreate(
    orgId: string,
    classId: string,
    settingId?: string,
  ): Promise<void> {
    const resolvedId = settingId ?? (await this.repo.findDefaultSetting(orgId))?.id
    if (!resolvedId) return

    await this.repo.createLock(orgId, classId, resolvedId)
  }

  // ─── Lock / Unlock ─────────────────────────────────────────────────────────

  async lockClass(classId: string, userId: string, orgId: string, dto: LockClassDto = {}) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')
    if (cls.educator_id !== userId) throw new ForbiddenException('You do not own this class')

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock setting assigned to this class')
    if (gradeLock.is_locked) throw new ConflictException('Class is already locked')

    const { isExpired, deadline } = this.resolveDeadline(gradeLock.setting)
    if (isExpired) {
      throw new ForbiddenException(
        `Cannot lock class after deadline (${deadline?.toISOString()})`,
      )
    }

    const updated = await this.repo.setLocked(classId, userId)
    await this.repo.lockGradingScaleForClass(classId, orgId)
    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'lock',
      reason: dto.reason,
    })

    // ── Activity log: educator locked grades ─────────────────────────────
    this.auditLogService.logActivityEvent({
      orgId,
      actorId:    userId,
      action:     'grade_locked',
      entityType: 'class',
      entityId:   classId,
      metadata:   { reason: dto.reason ?? null },
    }).catch(() => {})

    return { success: true, gradeLock: updated }
  }

  async unlockClass(classId: string, userId: string, userRole: string, orgId: string, dto: UnlockClassDto) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')

    if (userRole !== 'admin' && cls.educator_id !== userId) {
      throw new ForbiddenException('You do not own this class')
    }

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock assigned to this class')
    if (!gradeLock.is_locked) throw new BadRequestException('Class is not locked')

    if (userRole !== 'admin') {
      const { isExpired } = this.resolveDeadline(gradeLock.setting)
      if (isExpired) {
        throw new ForbiddenException('Cannot unlock class after deadline. Contact administrator.')
      }
    }

    const updated = await this.repo.setUnlocked(classId)

    const action = userRole === 'admin' ? 'ADMIN_CLASS_UNLOCK_OVERRIDE' : 'EDUCATOR_CLASS_UNLOCK'
    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'unlock',
      reason: dto.reason,
      metadata: { action, userRole },
    })

    // ── Audit log: admin override unlock ─────────────────────────────────
    if (userRole === 'admin') {
      this.auditLogService.logAdminAction({
        orgId,
        actorId:    userId,
        action:     'grade_lock_override',
        entityType: 'class',
        entityId:   classId,
        metadata:   {
          action: 'ADMIN_CLASS_UNLOCK_OVERRIDE',
          reason: dto.reason ?? null,
          previously_locked_by: gradeLock.locked_by,
        },
      }).catch(() => {})
    }

    return { success: true, gradeLock: updated }
  }

  async overrideLock(classId: string, userId: string, orgId: string, dto: OverrideGradeLockDto) {
    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock assigned to this class')
    if (!gradeLock.is_locked) throw new BadRequestException('Class is not locked — nothing to override')
    if (!gradeLock.setting.allowOverride) {
      throw new ForbiddenException('This lock setting does not permit overrides')
    }

    const updated = await this.repo.setUnlocked(classId)

    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'override',
      reason: dto.reason,
      metadata: {
        previous_locked_by: gradeLock.locked_by,
        previous_locked_at: gradeLock.locked_at,
      },
    })

    // ── Audit log: grade lock override ───────────────────────────────────
    this.auditLogService.logAdminAction({
      orgId,
      actorId:    userId,
      action:     'grade_lock_override',
      entityType: 'class',
      entityId:   classId,
      metadata:   {
        reason:              dto.reason ?? null,
        previous_locked_by:  gradeLock.locked_by,
        previous_locked_at:  gradeLock.locked_at,
      },
    }).catch(() => {})

    return { success: true, gradeLock: updated }
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getClassLocks(orgId: string) {
    const [classes, locks] = await Promise.all([
      this.repo.findAllClassesWithRelations(orgId),
      this.repo.findAllLocksWithClass(orgId),
    ])

    const lockMap = new Map(locks.map((l) => [l.class_id, l]))

    const merged = classes.map((cls) => {
      const existingLock = lockMap.get(cls.id)
      if (existingLock) return existingLock
      return {
        id: `virtual-${cls.id}`,
        org_id: orgId,
        class_id: cls.id,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        created_at: cls.created_at,
        setting: null,
        class: cls,
      }
    })

    return this.hydrateLocks(merged, orgId)
  }

  async getClassLocksBySchoolYear(orgId: string, schoolYearId: string) {
    const [classes, locks] = await Promise.all([
      this.repo.findAllClassesWithRelations(orgId),
      this.repo.findLocksBySchoolYear(orgId, schoolYearId),
    ])

    const filteredClasses = classes.filter(
      (cls) => cls.school_year_id === schoolYearId,
    )

    const lockMap = new Map(locks.map((l) => [l.class_id, l]))

    const merged = filteredClasses.map((cls) => {
      const existingLock = lockMap.get(cls.id)
      if (existingLock) return existingLock
      return {
        id: `virtual-${cls.id}`,
        org_id: orgId,
        class_id: cls.id,
        is_locked: false,
        locked_by: null,
        locked_at: null,
        created_at: cls.created_at,
        setting: null,
        class: cls,
      }
    })

    return this.hydrateLocks(merged, orgId)
  }

  async getEventsForClass(orgId: string, classId: string) {
    return this.repo.findEventsByClassId(orgId, classId)
  }

  // ─── Auto-lock ─────────────────────────────────────────────────────────────

  async autoLockExpiredClasses(orgId: string) {
    const now = new Date()
    let lockedCount = 0

    // 1. Absolute deadline locks
    const deadlineLocks = await this.repo.findExpiredUnlockedLocks(orgId, now)
    for (const lock of deadlineLocks) {
      await this.repo.setLocked(lock.class_id, 'system')
      await this.repo.createEvent({
        org_id: orgId,
        class_id: lock.class_id,
        actor_id: 'system',
        type: 'lock',
        reason: 'Auto-locked: deadline passed',
        metadata: { lock_deadline: lock.setting.lock_deadline },
      })

      // ── Audit log: auto grade lock ──────────────────────────────────────
      this.auditLogService.logAdminAction({
        orgId,
        actorId:    'system',
        action:     'AUTO_GRADE_LOCK',
        entityType: 'class',
        entityId:   lock.class_id,
        metadata:   { reason: 'deadline_passed', lock_deadline: lock.setting.lock_deadline },
      }).catch(() => {})

      lockedCount++
    }

    // 2. deadlineDays-based locks (computed against school year end_date)
    const relativeLocks = await this.repo.findUnlockedLocksWithSchoolYear(orgId)
    for (const lock of relativeLocks) {
      const endDate = (lock.class as any).schoolYear?.end_date
      if (!endDate || lock.setting.deadlineDays == null) continue

      const deadline = new Date(endDate)
      deadline.setDate(deadline.getDate() - lock.setting.deadlineDays)

      if (now >= deadline) {
        await this.repo.setLocked(lock.class_id, 'system')
        await this.repo.createEvent({
          org_id: orgId,
          class_id: lock.class_id,
          actor_id: 'system',
          type: 'lock',
          reason: 'Auto-locked: relative deadline passed',
          metadata: { computed_deadline: deadline.toISOString(), deadlineDays: lock.setting.deadlineDays },
        })

        // ── Audit log: auto grade lock (relative) ───────────────────────
        this.auditLogService.logAdminAction({
          orgId,
          actorId:    'system',
          action:     'AUTO_GRADE_LOCK',
          entityType: 'class',
          entityId:   lock.class_id,
          metadata:   {
            reason:            'relative_deadline_passed',
            computed_deadline: deadline.toISOString(),
            deadlineDays:      lock.setting.deadlineDays,
          },
        }).catch(() => {})

        lockedCount++
      }
    }

    return { success: true, lockedCount }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private resolveDeadline(setting: {
    lock_deadline?: Date | null
    deadlineDays?: number | null
  }): { isExpired: boolean; deadline: Date | null } {
    if (setting.lock_deadline) {
      return {
        isExpired: new Date() > setting.lock_deadline,
        deadline: setting.lock_deadline,
      }
    }
    return { isExpired: false, deadline: null }
  }

  private async hydrateLocks(locks: any[], orgId: string) {
    const educatorIds = [...new Set(locks.map((l) => l.class.educator_id))]
    const profiles = await this.repo.findProfilesByAccountIds(educatorIds)
    const educatorMap = new Map(profiles.map((p) => [p.account_id, p.full_name ?? 'Unknown Educator']))

    return locks.map((lock) => this.mapLock(lock, orgId, educatorMap))
  }

  private mapLock(lock: any, orgId: string, educatorMap: Map<string, string>) {
    const setting = lock.setting ?? null

    const educatorName =
      educatorMap.get(lock.class.educator_id) ?? 'Unknown Educator'

    const subjectName = lock.class.subject?.name ?? 'Unknown Subject'

    const lockStatus = lock.is_locked
      ? lock.locked_by === 'system'
        ? 'auto_locked'
        : 'locked'
      : 'unlocked'

    const { deadline } = setting
      ? this.resolveDeadline(setting)
      : { deadline: null }

    return {
      id: lock.id,
      org_id: orgId,
      class_id: lock.class_id,
      is_locked: lock.is_locked,
      locked_by: lock.locked_by,
      locked_at: lock.locked_at,
      created_at: lock.created_at,
      lockStatus,
      deadline,

      setting: setting
        ? {
            id: setting.id,
            name: setting.name,
            lockType: setting.lockType,
            allowOverride: setting.allowOverride,
          }
        : null,

      className: subjectName,
      educatorName,

      class: {
        id: lock.class.id,
        subject_id: lock.class.subject_id,
        educator_id: lock.class.educator_id,
        school_year_id: lock.class.school_year_id,
        subject: lock.class.subject ?? null,
      },
    }
  }
}
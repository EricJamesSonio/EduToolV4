import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'
import { GradeLockValidator } from './grade-lock.validator'
import { AuditLogService } from '../audit-log/audit-log.service'
import { resolveDeadline } from './grade-lock.utils'
import type { AssignSettingDto, LockClassDto, UnlockClassDto, OverrideGradeLockDto } from './dto/grade-lock.dto'

@Injectable()
export class GradeLockOperationsService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly validator: GradeLockValidator,
    private readonly auditLogService: AuditLogService,
  ) {}

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

  async lockClass(classId: string, userId: string, orgId: string, dto: LockClassDto = {}) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')
    if (cls.educator_id !== userId) throw new ForbiddenException('You do not own this class')

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock setting assigned to this class')
    if (gradeLock.is_locked) throw new ConflictException('Class is already locked')

    const { isExpired, deadline } = resolveDeadline(gradeLock.setting)
    if (isExpired) {
      throw new ForbiddenException(
        `Cannot lock class after deadline (${deadline?.toISOString()})`,
      )
    }

    const readiness = await this.validator.validateReadiness(classId, orgId)
    if (!readiness.ready) {
      throw new BadRequestException({
        message: 'Grade readiness validation failed',
        issues: readiness.issues,
      })
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
      const { isExpired } = resolveDeadline(gradeLock.setting)
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
}

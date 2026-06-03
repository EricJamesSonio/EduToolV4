import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import { GradeLockRepository } from './grade-lock.repository'
import { AuditLogService } from '../audit-log/audit-log.service'
import { resolveDeadline } from './grade-lock.utils'
import type { RequestUnlockDto, GrantUnlockDto } from './dto/grade-lock.dto'

@Injectable()
export class GradeLockRequestsService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getClassLockInfo(classId: string, orgId: string) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')

    const gradeLock = await this.repo.findLockByClassIdWithSubject(classId)

    const hasPendingRequest = gradeLock
      ? (await this.repo.findEventsByClassId(orgId, classId))
          .some((e) => e.type === 'unlock_request')
      : false

    const { isExpired, deadline } = gradeLock?.setting
      ? resolveDeadline(gradeLock.setting)
      : { isExpired: false, deadline: null }

    return {
      is_locked: gradeLock?.is_locked ?? false,
      locked_at: gradeLock?.locked_at ?? null,
      locked_by: gradeLock?.locked_by ?? null,
      setting: gradeLock?.setting
        ? {
            id: gradeLock.setting.id,
            name: gradeLock.setting.name,
            lock_deadline: gradeLock.setting.lock_deadline,
            deadlineDays: gradeLock.setting.deadlineDays,
            allowOverride: gradeLock.setting.allowOverride,
          }
        : null,
      hasPendingRequest,
      deadlineExpired: isExpired,
      deadline,
    }
  }

  async requestUnlock(classId: string, userId: string, orgId: string, dto: RequestUnlockDto) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')
    if (cls.educator_id !== userId) throw new ForbiddenException('You do not own this class')

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock assigned to this class')
    if (!gradeLock.is_locked) throw new BadRequestException('Class is not locked')

    const events = await this.repo.findEventsByClassId(orgId, classId)
    if (events.some((e) => e.type === 'unlock_request')) {
      throw new ConflictException('An unlock request is already pending for this class')
    }

    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'unlock_request',
      reason: dto.reason,
    })

    return { success: true }
  }

  async getUnlockRequests(orgId: string) {
    return this.repo.findUnlockRequests(orgId)
  }

  async grantUnlock(classId: string, userId: string, orgId: string, dto: GrantUnlockDto) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock assigned to this class')
    if (!gradeLock.is_locked) throw new BadRequestException('Class is not locked')

    const updated = await this.repo.setUnlocked(classId)

    const metadata: Record<string, any> = {
      granted_by: userId,
      granted_at: new Date().toISOString(),
    }
    if (dto.newDeadline) {
      metadata.new_deadline = dto.newDeadline
    }

    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'grant_unlock',
      reason: dto.reason,
      metadata,
    })

    this.auditLogService.logAdminAction({
      orgId,
      actorId: userId,
      action: 'grade_lock_unlock_granted',
      entityType: 'class',
      entityId: classId,
      metadata: { reason: dto.reason, newDeadline: dto.newDeadline ?? null },
    }).catch(() => {})

    return { success: true, gradeLock: updated }
  }

  async denyUnlock(classId: string, userId: string, orgId: string, reason: string) {
    const cls = await this.repo.findClassById(classId)
    if (!cls) throw new NotFoundException('Class not found')

    const gradeLock = await this.repo.findLockByClassId(classId)
    if (!gradeLock) throw new NotFoundException('No grade lock assigned to this class')

    await this.repo.createEvent({
      org_id: orgId,
      class_id: classId,
      actor_id: userId,
      type: 'deny_unlock',
      reason,
      metadata: { denied_by: userId, denied_at: new Date().toISOString() },
    })

    this.auditLogService.logAdminAction({
      orgId,
      actorId: userId,
      action: 'grade_lock_unlock_denied',
      entityType: 'class',
      entityId: classId,
      metadata: { reason },
    }).catch(() => {})

    return { success: true }
  }
}

import { Injectable } from '@nestjs/common';
import { GradeLockRepository } from './grade-lock.repository';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class GradeLockAutoService {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async autoLockExpiredClasses(orgId: string) {
    const now = new Date();
    let lockedCount = 0;

    const deadlineLocks = await this.repo.findExpiredUnlockedLocks(orgId, now);
    for (const lock of deadlineLocks) {
      await this.repo.setLocked(lock.class_id, 'system');
      await this.repo.createEvent({
        org_id: orgId,
        class_id: lock.class_id,
        actor_id: 'system',
        type: 'lock',
        reason: 'Auto-locked: deadline passed',
        metadata: { lock_deadline: lock.setting.lock_deadline },
      });

      this.auditLogService
        .logAdminAction({
          orgId,
          actorId: 'system',
          action: 'AUTO_GRADE_LOCK',
          entityType: 'class',
          entityId: lock.class_id,
          metadata: {
            reason: 'deadline_passed',
            lock_deadline: lock.setting.lock_deadline,
          },
        })
        .catch(() => {});

      lockedCount++;
    }

    const relativeLocks =
      await this.repo.findUnlockedLocksWithSchoolYear(orgId);
    for (const lock of relativeLocks) {
      const endDate = (lock.class as any).schoolYear?.end_date;
      if (!endDate || lock.setting.deadlineDays == null) continue;

      const deadline = new Date(endDate);
      deadline.setDate(deadline.getDate() - lock.setting.deadlineDays);

      if (now >= deadline) {
        await this.repo.setLocked(lock.class_id, 'system');
        await this.repo.createEvent({
          org_id: orgId,
          class_id: lock.class_id,
          actor_id: 'system',
          type: 'lock',
          reason: 'Auto-locked: relative deadline passed',
          metadata: {
            computed_deadline: deadline.toISOString(),
            deadlineDays: lock.setting.deadlineDays,
          },
        });

        this.auditLogService
          .logAdminAction({
            orgId,
            actorId: 'system',
            action: 'AUTO_GRADE_LOCK',
            entityType: 'class',
            entityId: lock.class_id,
            metadata: {
              reason: 'relative_deadline_passed',
              computed_deadline: deadline.toISOString(),
              deadlineDays: lock.setting.deadlineDays,
            },
          })
          .catch(() => {});

        lockedCount++;
      }
    }

    return { success: true, lockedCount };
  }
}

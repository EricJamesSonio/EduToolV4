import { Injectable } from '@nestjs/common';
import { GradeLockRepository } from './grade-lock.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  addDaysToCalendarDate,
  calendarDateOf,
  calendarDateToUtc,
  todayInZone,
} from '@/commons/utils/datetime.util';

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
      await this.repo.lockGradingScaleForClass(lock.class_id, orgId);
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
    const today = todayInZone();
    for (const lock of relativeLocks) {
      const endDate = (lock.class as any).schoolYear?.end_date;
      if (!endDate || lock.setting.deadlineDays == null) continue;

      // TICK-INFRA-017: relative deadlines are CALENDAR math on the school
      // year end day (tolerant of legacy 16:00Z rows), compared as
      // "YYYY-MM-DD" strings. No setDate/getDate — those read the process
      // zone and shift the deadline by hours on non-Manila servers.
      const deadlineDay = addDaysToCalendarDate(
        calendarDateOf(endDate),
        -lock.setting.deadlineDays,
      );

      if (today >= deadlineDay) {
        await this.repo.setLocked(lock.class_id, 'system');
        await this.repo.lockGradingScaleForClass(lock.class_id, orgId);
        await this.repo.createEvent({
          org_id: orgId,
          class_id: lock.class_id,
          actor_id: 'system',
          type: 'lock',
          reason: 'Auto-locked: relative deadline passed',
        metadata: {
          computed_deadline: calendarDateToUtc(deadlineDay).toISOString(),
          deadline_day: deadlineDay,
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
            computed_deadline: calendarDateToUtc(deadlineDay).toISOString(),
            deadline_day: deadlineDay,
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

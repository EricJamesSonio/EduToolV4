// src/modules/enrollment-portal/registrar/enrollment-auto-lock.service.ts
//
// Phase 5. Mirrors the existing grade-lock auto-sweep pattern
// (modules/grade-lock/grade-lock-auto.service.ts): a scheduler-triggered sweep
// that flips rows past their date, writing a system actor into the audit log.
//
// Idempotent: only `pending` applications change, so running the sweep again in
// the same lock window is a no-op (no double-log, no error on already-locked rows).
import { Injectable } from '@nestjs/common';
import { EnrollmentRegistrarRepository } from './enrollment-registrar.repository';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';

@Injectable()
export class EnrollmentAutoLockService {
  constructor(
    private readonly repo: EnrollmentRegistrarRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async lockExpired() {
    const now = new Date();
    const expired = await this.repo.findExpiredPendingApplications(now);

    // Perf Phase 3: one batched UPDATE instead of one per application.
    // Re-read the actually-locked rows so audit/count only cover rows this
    // sweep transitioned (a concurrent sweeper may have taken some first).
    const { count } = await this.repo.lockManyApplications(
      expired.map((app) => app.id),
    );
    const lockedIds =
      count === expired.length
        ? new Set(expired.map((app) => app.id))
        : new Set(
            (
              await this.repo.findLockedApplicationsByIds(
                expired.map((app) => app.id),
              )
            ).map((app) => app.id),
          );

    let lockedCount = 0;
    for (const app of expired) {
      if (!lockedIds.has(app.id)) continue;

      this.auditLogService
        .logAdminAction({
          orgId: app.org_id,
          actorId: 'system',
          action: 'ENROLLMENT_APPLICATION_AUTO_LOCK',
          entityType: 'enrollment_application',
          entityId: app.id,
          metadata: {
            application_code: app.application_code,
            period_name: app.enrollmentPeriod.name,
            lock_date: app.enrollmentPeriod.lock_date,
          },
        })
        .catch(() => {});

      lockedCount++;
    }

    return { success: true, lockedCount };
  }
}

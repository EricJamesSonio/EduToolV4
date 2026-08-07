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

    let lockedCount = 0;
    for (const app of expired) {
      await this.repo.lockApplication(app.id);

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
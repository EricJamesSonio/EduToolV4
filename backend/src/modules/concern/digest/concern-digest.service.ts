// src/modules/concern/digest/concern-digest.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { MailService } from '@/modules/mail/mail.service';

export const CONCERN_DIGEST_WINDOW_MS = 60_000;

/**
 * Concern digest batcher, built on the existing @nestjs/schedule cron infra —
 * no Redis, no external queue.
 *
 * Debounce semantics (the same as the BullMQ jobId-collision design it replaces):
 *  - A new concern "arms" a per-org window by virtue of row visibility.
 *  - The cron scan only emails an org once its oldest *unreported* concern is
 *    at least WINDOW old, which both batches everything created in the window
 *    and guarantees at most one digest per org per window (no counters/locks).
 *  - OrgConcernSetting.last_digest_sent_at is the ONLY piece of state; it is
 *    always advanced to the job's own `now()` (never derived from counted
 *    rows), and the count uses `created_at > last_digest_sent_at` (gt, not gte)
 *    to avoid boundary double-counting.
 *  - No new concern → nothing for the org to be newest over → no email.
 */
@Injectable()
export class ConcernDigestService {
  private readonly logger = new Logger(ConcernDigestService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Producer contact point called when a brand-new concern is created
   * (Phase 2). Under the cron design nothing is enqueued; the concern row
   * itself arms the window. Kept as a no-op call site so the producer concept
   * stays explicit and a future queue swap only touches this method.
   */
  async enqueueConcernDigest(_orgId: string): Promise<void> {
    return;
  }

  /**
   * Invoked by the scheduler on a fixed cadence. Scans each org that has any
   * unreported concern and flushes a digest once the window has elapsed.
   */
  async processDueDigests(): Promise<void> {
    const orgIds = await this.db.concern.findMany({
      where: { created_at: { gt: new Date(0) } },
      distinct: ['org_id'],
      select: { org_id: true },
    });

    for (const { org_id } of orgIds) {
      try {
        await this.processOrg(org_id);
      } catch (err) {
        // A throw here must not stop the scan for other orgs.
        this.logger.error(`Concern digest scan failed for org ${org_id}`, err);
      }
    }
  }

  private async processOrg(orgId: string): Promise<void> {
    const setting = await this.db.orgConcernSetting.findUnique({
      where: { org_id: orgId },
    });
    const since = setting?.last_digest_sent_at ?? new Date(0);

    // Oldest unreported concern determines whether the window has elapsed.
    const oldest = await this.db.concern.findFirst({
      where: { org_id: orgId, created_at: { gt: since } },
      orderBy: { created_at: 'asc' },
      select: { created_at: true },
    });

    // No unreported concerns → nothing to send, and don't disturb the setting.
    if (!oldest) return;

    // Window still open (oldest concern younger than the 60s debounce window).
    const now = new Date();
    if (now.getTime() - oldest.created_at.getTime() < CONCERN_DIGEST_WINDOW_MS) {
      return;
    }

    const count = await this.db.concern.count({
      where: { org_id: orgId, created_at: { gt: since } },
    });

    if (count > 0) {
      const recipients = await this.db.account.findMany({
        where: { org_id: orgId, role: 'admin', status: 'active' },
        include: { profile: true },
      });

      for (const acct of recipients) {
        const to = acct.profile?.personal_email;
        if (!to) continue;
        try {
          await this.mailService.sendConcernDigestEmail(to, count);
        } catch (err) {
          // One bad recipient must not block the others or fail the job.
          this.logger.error(`Concern digest email failed for ${to}`, err);
        }
      }
    }

    // Always advance, success, partial failure, or even zero admin recipients —
    // prevents the next window from double-counting concerns already reported.
    await this.db.orgConcernSetting.upsert({
      where: { org_id: orgId },
      update: { last_digest_sent_at: now },
      create: { org_id: orgId, last_digest_sent_at: now },
    });
  }
}
// src/core/scheduler/scheduler.tasks.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GradeLockService } from '@/modules/grade-lock/grade-lock.service';
import { SubmissionService } from '@/modules/submission/submission.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SchedulerTasks {
  private readonly logger = new Logger(SchedulerTasks.name);

  constructor(
    private readonly gradeLockService: GradeLockService,
    private readonly submissionService: SubmissionService,
    private readonly notificationService: NotificationService,
    private readonly db: DatabaseService,
  ) {}

  // Runs every hour — auto-locks classes past their deadline
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoGradeLock() {
    this.logger.log('Running auto grade lock check...');
    try {
      const orgs = await this.db.account.findMany({
        where: { role: 'admin', status: 'active', org_id: { not: null } },
        select: { org_id: true },
        distinct: ['org_id'],
      });

      for (const { org_id } of orgs) {
        if (org_id) await this.gradeLockService.autoLock(org_id);
      }
    } catch (err) {
      this.logger.error('Auto grade lock failed', err);
    }
  }

  // Runs every 30 minutes — closes draft submissions past end date
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCloseExpiredDrafts() {
    this.logger.log('Closing expired draft submissions...');
    try {
      const expired = await this.db.assessment.findMany({
        where: {
          end_date: { lt: new Date() },
          deleted_at: null,
        },
        select: { id: true },
      });

      for (const { id } of expired) {
        await this.submissionService.closeExpiredDrafts(id);
      }
    } catch (err) {
      this.logger.error('Close expired drafts failed', err);
    }
  }

// In scheduler.tasks.ts — replace the handleNotificationArchiving body:
  @Cron('0 2 * * *')
  async handleNotificationArchiving() {
    this.logger.log('Archiving old notifications...');
    try {
      await this.notificationService.archiveOldNotifications(); // already implemented
    } catch (err) {
      this.logger.error('Notification archiving failed', err);
    }
  }
}
// @/modules/notification/notification.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { QueryNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  // ── GET /notifications ──────────────────────────────────────────────────────

  async findForUser(accountId: string, orgId: string, query: QueryNotificationDto) {
    return this.notificationRepository.findByUser(
      accountId,
      orgId,
      query.unreadOnly,
    );
  }

  // ── DELETE /notifications/:id ───────────────────────────────────────────────

  async dismiss(id: string, accountId: string) {
    const notification = await this.notificationRepository.findById(
      id,
      accountId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    // Users can only dismiss their own notifications
    if (notification.account_id !== accountId) {
      throw new ForbiddenException(
        'You can only dismiss your own notifications.',
      );
    }

    await this.notificationRepository.delete(id);
  }

  // ── Internal (called by event listeners in Phase 4) ─────────────────────────

  async createNotification(data: {
    orgId: string;
    accountId: string;
    type: string;
    payload: object;
  }) {
    return this.notificationRepository.create(data);
  }

  /**
   * Notify multiple users at once — e.g. all students in a class.
   */
  async createBulkNotifications(
    notifications: Array<{
      orgId: string;
      accountId: string;
      type: string;
      payload: object;
    }>,
  ) {
    if (notifications.length === 0) return;
    return this.notificationRepository.createMany(notifications);
  }

  /**
   * Archive notifications older than 90 days.
   * Called by the daily scheduler in Phase 4.
   */
  async archiveOldNotifications() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return this.notificationRepository.archiveOlderThan(cutoff);
  }
}
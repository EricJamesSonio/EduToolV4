// @/modules/notification/notification.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { QueryNotificationDto } from './dto/notification.dto';

export interface NotificationView {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  private toView(n: {
    id: string;
    type: string;
    payload: unknown;
    read_at: Date | null;
    created_at: Date;
  }): NotificationView {
    return {
      id: n.id,
      type: n.type,
      payload: (n.payload ?? {}) as Record<string, unknown>,
      isRead: n.read_at !== null,
      createdAt: n.created_at,
    };
  }

  // ── GET /notifications ──────────────────────────────────────────────────────

  async findForUser(
    accountId: string,
    orgId: string,
    query: QueryNotificationDto,
  ) {
    const { data, meta } = await this.notificationRepository.findByUser(
      accountId,
      orgId,
      query.unreadOnly,
      query.page,
      query.limit,
    );

    return { data: data.map((n) => this.toView(n)), meta };
  }

  // ── GET /notifications/summary ──────────────────────────────────────────────

  /**
   * Total unread + unread per type, e.g.
   * { unreadCount: 15, byType: { concern_created: 5, application_submitted: 10 } }
   */
  async getSummary(accountId: string, orgId: string) {
    const rows = await this.notificationRepository.countUnreadByType(
      accountId,
      orgId,
    );

    const byType: Record<string, number> = {};
    let unreadCount = 0;
    for (const row of rows) {
      byType[row.type] = row.count;
      unreadCount += row.count;
    }

    return { unreadCount, byType };
  }

  // ── PATCH /notifications/:id/read ───────────────────────────────────────────

  async markRead(id: string, accountId: string) {
    // findById is scoped to the caller's account, so this also enforces ownership.
    const notification = await this.notificationRepository.findById(
      id,
      accountId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (!notification.read_at) {
      await this.notificationRepository.markAsRead(id);
    }
  }

  // ── PATCH /notifications/read-all ───────────────────────────────────────────

  async markAllRead(accountId: string, orgId: string) {
    await this.notificationRepository.markAllAsRead(accountId, orgId);
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

  // ── Internal (called by other modules) ──────────────────────────────────────

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
   * Notify every admin and registrar in an org (e.g. a new enrollment
   * application came in through the public portal).
   */
  async notifyOrgStaff(orgId: string, type: string, payload: object) {
    const accountIds = await this.notificationRepository.findOrgStaffIds(orgId);
    if (accountIds.length === 0) return;

    return this.notificationRepository.createMany(
      accountIds.map((accountId) => ({ orgId, accountId, type, payload })),
    );
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
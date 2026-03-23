// src/modules/notification/notification.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class NotificationRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    accountId: string;
    type: string;
    payload: object;
  }) {
    return this.db.notification.create({
      data: {
        org_id: data.orgId,
        account_id: data.accountId,
        type: data.type,
        payload: data.payload,
      },
    });
  }

  /**
   * Find all active (non-archived) notifications for a user.
   * Sorted newest first.
   */
  async findByUser(accountId: string, orgId: string, unreadOnly = false) {
    return this.db.notification.findMany({
      where: {
        account_id: accountId,
        org_id: orgId,
        archived_at: null,
        ...(unreadOnly ? { read_at: null } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, accountId: string) {
    return this.db.notification.findFirst({
      where: { id, account_id: accountId },
    });
  }

  async markAsRead(id: string) {
    return this.db.notification.update({
      where: { id },
      data: { read_at: new Date() },
    });
  }

  async delete(id: string) {
    return this.db.notification.delete({ where: { id } });
  }

  /**
   * Archive all notifications older than 90 days.
   * Called by the scheduled job in Phase 4.
   */
  async archiveOlderThan(date: Date) {
    return this.db.notification.updateMany({
      where: {
        created_at: { lt: date },
        archived_at: null,
      },
      data: { archived_at: new Date() },
    });
  }

  /**
   * Bulk create — used when notifying multiple users at once
   * (e.g. all students in a class when a grade is locked).
   */
  async createMany(
    notifications: Array<{
      orgId: string;
      accountId: string;
      type: string;
      payload: object;
    }>,
  ) {
    return this.db.notification.createMany({
      data: notifications.map((n) => ({
        org_id: n.orgId,
        account_id: n.accountId,
        type: n.type,
        payload: n.payload,
      })),
    });
  }
}
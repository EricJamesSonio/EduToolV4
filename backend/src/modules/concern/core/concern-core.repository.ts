// src/modules/concern/core/concern-core.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma, Role, ConcernStatus } from '@prisma/client';
import { DEFAULT_CONCERN_CATEGORIES } from '../data/default-categories.data';

@Injectable()
export class ConcernCoreRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Idempotently backfill any missing default categories for an org. Existing
   * rows (including deactivated ones) are left untouched — only labels that do
   * not yet exist are created, so the category list is never empty while admin
   * decisions (deactivation/rename) are respected.
   */
  async ensureDefaultCategories(orgId: string) {
    const existing = await this.db.concernCategory.findMany({
      where: {
        org_id: orgId,
        label: { in: [...DEFAULT_CONCERN_CATEGORIES] },
      },
      select: { label: true },
    });
    const existingLabels = new Set(existing.map((c) => c.label));
    const missing = [...DEFAULT_CONCERN_CATEGORIES].filter(
      (label) => !existingLabels.has(label),
    );
    if (missing.length === 0) return;

    await this.db.concernCategory.createMany({
      data: missing.map((label) => ({
        org_id: orgId,
        label,
        is_default: true,
      })),
      skipDuplicates: true,
    });
  }

  findActiveCategories(orgId: string) {
    return this.db.concernCategory.findMany({
      where: { org_id: orgId, is_active: true },
      orderBy: { label: 'asc' },
    });
  }

  findAllCategories(orgId: string) {
    return this.db.concernCategory.findMany({
      where: { org_id: orgId },
      orderBy: { label: 'asc' },
    });
  }

  findCategoryByIdInOrg(orgId: string, categoryId: string) {
    return this.db.concernCategory.findFirst({
      where: { id: categoryId, org_id: orgId },
    });
  }

  findActiveCategoryInOrg(orgId: string, categoryId: string) {
    return this.db.concernCategory.findFirst({
      where: { id: categoryId, org_id: orgId, is_active: true },
    });
  }

  findById(orgId: string, concernId: string) {
    return this.db.concern.findFirst({
      where: { id: concernId, org_id: orgId },
      include: { messages: { orderBy: { created_at: 'asc' } }, category: true },
    });
  }

  /**
   * Create the Concern and its first ConcernMessage in a single transaction.
   */
  async createConcernWithFirstMessage(
    orgId: string,
    data: {
      categoryId: string;
      senderAccountId: string;
      senderRole: Role;
      senderName: string;
      subject: string;
      body: string;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const now = new Date();
      const concern = await tx.concern.create({
        data: {
          org_id: orgId,
          category_id: data.categoryId,
          sender_account_id: data.senderAccountId,
          sender_role: data.senderRole,
          subject: data.subject,
          last_message_at: now,
        },
      });

      await tx.concernMessage.create({
        data: {
          org_id: orgId,
          concern_id: concern.id,
          sender_account_id: data.senderAccountId,
          sender_role: data.senderRole,
          sender_name: data.senderName,
          body: data.body,
        },
      });

      return tx.concern.findFirst({
        where: { id: concern.id },
        include: {
          messages: { orderBy: { created_at: 'asc' } },
          category: true,
        },
      });
    });
  }

  /**
   * Append a message to a concern, touch last_message_at, and if the concern is
   * currently resolved, flip it back to open (auto-reopen on sender reply).
   */
  async addMessageAndMaybeReopen(
    orgId: string,
    concernId: string,
    sender: { accountId: string; role: Role; name: string },
    body: string,
  ) {
    return this.db.$transaction(async (tx) => {
      await tx.concernMessage.create({
        data: {
          org_id: orgId,
          concern_id: concernId,
          sender_account_id: sender.accountId,
          sender_role: sender.role,
          sender_name: sender.name,
          body,
        },
      });

      await tx.concern.update({
        where: { id: concernId },
        data: { last_message_at: new Date() },
      });

      await tx.concern.updateMany({
        where: { id: concernId, org_id: orgId, status: 'resolved' },
        data: { status: 'open', resolved_by: null, resolved_at: null },
      });

      return tx.concern.findFirst({
        where: { id: concernId },
        include: {
          messages: { orderBy: { created_at: 'asc' } },
          category: true,
        },
      });
    });
  }

  async listStaff(
    orgId: string,
    query: {
      status?: ConcernStatus;
      categoryId?: string;
      senderRole?: Role;
      page: number;
      limit: number;
    },
  ) {
    const where: Prisma.ConcernWhereInput = {
      org_id: orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { category_id: query.categoryId } : {}),
      ...(query.senderRole ? { sender_role: query.senderRole } : {}),
    };

    const [data, total] = await this.db.$transaction([
      this.db.concern.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              label: true,
              is_default: true,
              is_active: true,
            },
          },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              id: true,
              sender_name: true,
              body: true,
              created_at: true,
            },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { last_message_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.db.concern.count({ where }),
    ]);

    return { data, total };
  }

  async setStatus(
    orgId: string,
    concernId: string,
    status: 'resolved' | 'open',
    actorId: string | null,
  ) {
    return this.db.concern.update({
      where: { id: concernId, org_id: orgId },
      data:
        status === 'resolved'
          ? { status, resolved_by: actorId, resolved_at: new Date() }
          : { status, resolved_by: null, resolved_at: null },
    });
  }

  // ── Student "my concerns" list ──────────────────────────────────────────

  async listMine(
    orgId: string,
    accountId: string,
    query: { page: number; limit: number },
  ) {
    const where: Prisma.ConcernWhereInput = {
      org_id: orgId,
      sender_account_id: accountId,
    };

    const [data, total] = await this.db.$transaction([
      this.db.concern.findMany({
        where,
        include: {
          category: { select: { id: true, label: true, is_active: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { last_message_at: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.db.concern.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * All active admins in the org. Registrar-flagged accounts still have
   * role === 'admin', so this naturally covers them.
   */
  findActiveAdmins(orgId: string) {
    return this.db.account.findMany({
      where: { org_id: orgId, role: 'admin', status: 'active' },
      select: { id: true },
    });
  }
}

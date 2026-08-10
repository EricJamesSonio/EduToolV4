// src/modules/concern/student/concern-student.service.ts
import { Injectable } from '@nestjs/common';
import { ConcernCoreService } from '../core/concern-core.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { ConcernDigestService } from '../digest/concern-digest.service';
import { DatabaseService } from '@/core/database/database.provider';
import { Role } from '@prisma/client';
import {
  CreateConcernDto,
  ReplyConcernDto,
  QueryConcernDto,
} from '../dto/concern.dto';

@Injectable()
export class ConcernStudentService {
  constructor(
    private readonly core: ConcernCoreService,
    private readonly notificationService: NotificationService,
    private readonly digestService: ConcernDigestService,
    private readonly db: DatabaseService,
  ) {}

  getCategories(orgId: string) {
    return this.core.findActiveCategories(orgId);
  }

  async submit(
    caller: { orgId: string; accountId: string; role: string; fullName?: string | null },
    dto: CreateConcernDto,
  ) {
    const concern = await this.core.createConcern(
      caller.orgId,
      dto.categoryId,
      {
        accountId: caller.accountId,
        role: caller.role as Role,
        name: caller.fullName ?? 'Student',
      },
      dto.subject,
      dto.body,
    );

    // In-app notifications to all org admins/registrars — single batch call.
    await this.notifyAdminsNewConcern(caller.orgId);

    // TODO Phase 3: wire real BullMQ digest job here.
    await this.digestService.enqueueConcernDigest(caller.orgId);

    return concern;
  }

  async listMine(orgId: string, accountId: string, query: QueryConcernDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.core.listMine(orgId, accountId, {
      page,
      limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  getOne(orgId: string, concernId: string, accountId: string) {
    return this.core.getOwnedById(orgId, concernId, accountId);
  }

  async reply(
    caller: {
      orgId: string;
      accountId: string;
      role: string;
      fullName?: string | null;
      concernId: string;
    },
    dto: ReplyConcernDto,
  ) {
    // Ownership check first — a student can only reply to their own concern.
    await this.core.getOwnedById(caller.orgId, caller.concernId, caller.accountId);

    const updated = await this.core.addMessage(
      caller.orgId,
      caller.concernId,
      {
        accountId: caller.accountId,
        role: caller.role as Role,
        name: caller.fullName ?? 'Student',
      },
      dto.body,
    );

    // New message on a concern (student direction) → notify all admins/registrars.
    await this.notifyAdminsNewConcern(caller.orgId);

    // NOTE: replies must NOT trigger the email digest in this direction —
    // only brand-new concerns do (handled in submit). No enqueue here.

    return updated;
  }

  private async notifyAdminsNewConcern(orgId: string) {
    const admins = await this.core.findOrgAdmins(orgId);
    if (admins.length === 0) return;
    await this.notificationService.createBulkNotifications(
      admins.map((a) => ({
        orgId,
        accountId: a.id,
        type: 'concern_created',
        payload: { concernType: 'new_concern' },
      })),
    );
  }
}
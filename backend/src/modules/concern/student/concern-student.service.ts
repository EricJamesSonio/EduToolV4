// src/modules/concern/student/concern-student.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
    caller: {
      orgId: string;
      accountId: string;
      role: string;
      fullName?: string | null;
    },
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

    // The concern row was just created in a transaction inside the core
    // service, so the re-read by id cannot miss. If it ever does, surface it
    // explicitly rather than dereferencing null and masking the real cause.
    if (!concern) {
      throw new InternalServerErrorException(
        'Concern was created but could not be reloaded.',
      );
    }

    // In-app notifications to all org admins/registrars — single batch call.
    // Payload carries everything the bell needs to render + deep-link
    // (/admin/concerns?concernId=...) without another lookup.
    await this.notifyAdmins(caller.orgId, 'concern_created', {
      concernType: 'new_concern',
      concernId: concern.id,
      studentName: caller.fullName ?? 'A student',
      subject: dto.subject,
    });

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
    await this.core.getOwnedById(
      caller.orgId,
      caller.concernId,
      caller.accountId,
    );

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
    await this.notifyAdmins(caller.orgId, 'concern_reply', {
      concernType: 'reply',
      concernId: caller.concernId,
      studentName: caller.fullName ?? 'A student',
    });

    // NOTE: replies must NOT trigger the email digest in this direction —
    // only brand-new concerns do (handled in submit). No enqueue here.

    return updated;
  }

  private async notifyAdmins(
    orgId: string,
    type: 'concern_created' | 'concern_reply',
    payload: Record<string, unknown>,
  ) {
    const admins = await this.core.findOrgAdmins(orgId);
    if (admins.length === 0) return;
    await this.notificationService.createBulkNotifications(
      admins.map((a) => ({
        orgId,
        accountId: a.id,
        type,
        payload,
      })),
    );
  }
}
// src/modules/concern/staff/concern-staff.service.ts
import { Injectable } from '@nestjs/common';
import { ConcernCoreService } from '../core/concern-core.service';
import { NotificationService } from '@/modules/notification/notification.service';
import { DatabaseService } from '@/core/database/database.provider';
import { Role } from '@prisma/client';
import {
  ReplyConcernDto,
  QueryStaffConcernDto,
} from '../dto/concern.dto';

@Injectable()
export class ConcernStaffService {
  constructor(
    private readonly core: ConcernCoreService,
    private readonly notificationService: NotificationService,
    private readonly db: DatabaseService,
  ) {}

  async listAll(orgId: string, query: QueryStaffConcernDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { data, total } = await this.core.listStaff(orgId, {
      status: query.status,
      categoryId: query.categoryId,
      senderRole: query.senderRole,
      page,
      limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  getOne(orgId: string, concernId: string) {
    return this.core.getById(orgId, concernId);
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
    // Load the concern to find its original sender for the notification.
    const concern = await this.core.getById(caller.orgId, caller.concernId);

    const updated = await this.core.addMessage(
      caller.orgId,
      caller.concernId,
      {
        accountId: caller.accountId,
        role: caller.role as Role,
        name: caller.fullName ?? 'Staff',
      },
      dto.body,
    );

    // Staff reply → in-app notification to the original sender only. No email
    // digest here (that direction is new-concern only, per the spec).
    await this.notificationService.createNotification({
      orgId: caller.orgId,
      accountId: concern.sender_account_id,
      type: 'concern_replied',
      payload: { concernId: concern.id, subject: concern.subject },
    });

    return updated;
  }

  resolve(orgId: string, concernId: string, accountId: string) {
    return this.core.resolve(orgId, concernId, accountId);
  }

  reopen(orgId: string, concernId: string) {
    return this.core.reopen(orgId, concernId);
  }
}
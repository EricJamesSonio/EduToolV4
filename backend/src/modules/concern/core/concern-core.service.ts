// src/modules/concern/core/concern-core.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConcernCoreRepository } from './concern-core.repository';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class ConcernCoreService {
  constructor(
    private readonly repo: ConcernCoreRepository,
    private readonly db: DatabaseService,
  ) {}

  async findActiveCategories(orgId: string) {
    return this.repo.findActiveCategories(orgId);
  }

  /**
   * Create a Concern + its first ConcernMessage atomically for a sender.
   * The sender's identity always comes from the caller, never a client body.
   */
  async createConcern(
    orgId: string,
    categoryId: string,
    sender: { accountId: string; role: string; name: string },
    subject: string,
    body: string,
  ) {
    const category = await this.repo.findActiveCategoryInOrg(orgId, categoryId);
    if (!category) {
      throw new NotFoundException('Category not found or inactive.');
    }

    const created = await this.repo.createConcernWithFirstMessage(orgId, {
      categoryId,
      senderAccountId: sender.accountId,
      senderRole: sender.role,
      senderName: sender.name,
      subject,
      body,
    });

    return created;
  }

  /**
   * Append a ConcernMessage. Shared by the student reply and the staff reply
   * paths. Returns the updated concern (with the resolved->open flip applied).
   */
  async addMessage(
    orgId: string,
    concernId: string,
    sender: { accountId: string; role: string; name: string },
    body: string,
    opts: { ownershipAccountId?: string } = {},
  ) {
    let concern = await this.repo.findById(orgId, concernId);
    if (!concern) throw new NotFoundException('Concern not found.');

    if (opts.ownershipAccountId) {
      // Student path: only the original sender can reply to their concern.
      if (concern.sender_account_id !== opts.ownershipAccountId) {
        throw new ForbiddenException('You can only reply to your own concerns.');
      }
    }

    const updated = await this.repo.addMessageAndMaybeReopen(orgId, concernId, sender, body);

    // Flip resolved -> open if the sender replies on a resolved concern
    // (this repos the exact rule for both student and staff directions where
    // the sender themselves is the one posting — the staff inbox handles its
    // resolve/reopen separately).
    return this.repo.findById(orgId, concernId);
  }

  // ── Staff-visible helpers ───────────────────────────────────────────────

  async getById(orgId: string, concernId: string) {
    const concern = await this.repo.findById(orgId, concernId);
    if (!concern) throw new NotFoundException('Concern not found.');
    return concern;
  }

  async listStaff(orgId: string, query: {
    status?: string;
    categoryId?: string;
    senderRole?: string;
    page: number;
    limit: number;
  }) {
    const { data, total } = await this.repo.listStaff(orgId, query);
    return {
      data,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async resolve(orgId: string, concernId: string, actorId: string) {
    const concern = await this.getById(orgId, concernId);
    return this.repo.setStatus(orgId, concernId, 'resolved', actorId);
  }

  async reopen(orgId: string, concernId: string) {
    const concern = await this.getById(orgId, concernId);
    return this.repo.setStatus(orgId, concernId, 'open', null);
  }
}
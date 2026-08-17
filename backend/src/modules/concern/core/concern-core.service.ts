// src/modules/concern/core/concern-core.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConcernCoreRepository } from './concern-core.repository';
import { Role, ConcernStatus } from '@prisma/client';

@Injectable()
export class ConcernCoreService {
  constructor(private readonly repo: ConcernCoreRepository) {}

  findOrgAdmins(orgId: string) {
    return this.repo.findActiveAdmins(orgId);
  }

  listMine(
    orgId: string,
    accountId: string,
    query: { page: number; limit: number },
  ) {
    return this.repo.listMine(orgId, accountId, query);
  }

  async findActiveCategories(orgId: string) {
    // Self-healing: guarantee defaults exist so the list is never empty.
    await this.repo.ensureDefaultCategories(orgId);
    return this.repo.findActiveCategories(orgId);
  }

  async findAllCategories(orgId: string) {
    // Self-healing: guarantee defaults exist so the list is never empty.
    await this.repo.ensureDefaultCategories(orgId);
    return this.repo.findAllCategories(orgId);
  }

  findCategoryById(orgId: string, categoryId: string) {
    return this.repo.findCategoryByIdInOrg(orgId, categoryId);
  }

  /**
   * Create a Concern + its first ConcernMessage atomically for a sender.
   * The sender identity always comes from the caller, never a client body.
   */
  createConcern(
    orgId: string,
    categoryId: string,
    sender: { accountId: string; role: Role; name: string },
    subject: string,
    body: string,
  ) {
    return this.repo.createConcernWithFirstMessage(orgId, {
      categoryId,
      senderAccountId: sender.accountId,
      senderRole: sender.role,
      senderName: sender.name,
      subject,
      body,
    });
  }

  /**
   * Get a concern owned by a specific account (student path). Returns null if
   * not found OR if ownership doesn't match — callers translate to 403/404.
   */
  async getOwnedById(orgId: string, concernId: string, accountId: string) {
    const concern = await this.repo.findById(orgId, concernId);
    if (!concern) throw new NotFoundException('Concern not found.');
    if (concern.sender_account_id !== accountId) {
      throw new ForbiddenException("You cannot access another user's concern.");
    }
    return concern;
  }

  /**
   * Append a ConcernMessage. Shared by the student reply and the staff reply
   * paths. Applies the resolved->open auto-reopen rule.
   */
  addMessage(
    orgId: string,
    concernId: string,
    sender: { accountId: string; role: Role; name: string },
    body: string,
  ) {
    return this.repo.addMessageAndMaybeReopen(orgId, concernId, sender, body);
  }

  // ── Staff-path helpers (shared) ─────────────────────────────────────────

  async getById(orgId: string, concernId: string) {
    const concern = await this.repo.findById(orgId, concernId);
    if (!concern) throw new NotFoundException('Concern not found.');
    return concern;
  }

  listStaff(
    orgId: string,
    query: {
      status?: string;
      categoryId?: string;
      senderRole?: string;
      page: number;
      limit: number;
    },
  ) {
    return this.repo.listStaff(orgId, {
      status: query.status as ConcernStatus | undefined,
      categoryId: query.categoryId,
      senderRole: query.senderRole as Role | undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  resolve(orgId: string, concernId: string, actorId: string) {
    return this.repo.setStatus(orgId, concernId, 'resolved', actorId);
  }

  reopen(orgId: string, concernId: string) {
    return this.repo.setStatus(orgId, concernId, 'open', null);
  }
}

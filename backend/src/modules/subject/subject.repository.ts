// src/modules/subject/subject.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class SubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    name: string;
    levelId: string;
    educatorId?: string;
  }) {
    return this.db.subject.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        level_id: data.levelId,
        educator_id: data.educatorId ?? null,
        is_locked: false,
      },
    });
  }

  async findAll(
    orgId: string,
    filters: { levelId?: string; educatorId?: string; search?: string },
  ) {
    return this.db.subject.findMany({
      where: {
        org_id: orgId,
        ...(filters.levelId ? { level_id: filters.levelId } : {}),
        ...(filters.educatorId ? { educator_id: filters.educatorId } : {}),
        ...(filters.search
          ? { name: { contains: filters.search, mode: 'insensitive' } }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.subject.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async update(
    id: string,
    data: { name?: string; levelId?: string; educatorId?: string | null },
  ) {
    return this.db.subject.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.levelId !== undefined ? { level_id: data.levelId } : {}),
        ...(data.educatorId !== undefined
          ? { educator_id: data.educatorId }
          : {}),
      },
    });
  }

  async setLocked(id: string, isLocked: boolean) {
    return this.db.subject.update({
      where: { id },
      data: { is_locked: isLocked },
    });
  }

  /**
   * Unlock all subjects in an org — called at the start of a new school year.
   * Phase 3 hook: triggered by school-year activation.
   */
  async unlockAllForOrg(orgId: string) {
    return this.db.subject.updateMany({
      where: { org_id: orgId, is_locked: true },
      data: { is_locked: false },
    });
  }
}
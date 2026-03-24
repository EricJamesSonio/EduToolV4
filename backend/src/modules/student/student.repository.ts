// src/modules/section/section.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class SectionRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    levelId: string;
    name: string;
    capacity: number;
  }) {
    return this.db.section.create({
      data: {
        org_id: data.orgId,
        level_id: data.levelId,
        name: data.name,
        capacity: data.capacity,
      },
    });
  }

  async findAll(orgId: string, levelId?: string) {
    return this.db.section.findMany({
      where: {
        org_id: orgId,
        ...(levelId ? { level_id: levelId } : {}),
        isDeleted: false,
      },
      orderBy: [{ level_id: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.section.findFirst({
      where: { id, org_id: orgId, isDeleted: false },
    });
  }

  async update(id: string, data: { name?: string; capacity?: number }) {
    return this.db.section.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete — sets deleted_at timestamp.
   * Section records are never hard-deleted per soft-delete policy.
   */
  async softDelete(id: string) {
    return this.db.section.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  /**
   * Count active students assigned to this section.
   * Queries profile.metadata.sectionId — wired in Phase 3.
   */
  async countStudentsInSection(sectionId: string): Promise<number> {
    return this.db.profile.count({
      where: {
        metadata: {
          path: ['sectionId'],
          equals: sectionId,
        },
        account: {
          role: 'student',
          deleted_at: null,
          status: 'active',
        },
      },
    });
  }

  /**
   * Check if any students are currently assigned to this section.
   * Used to block deletion of sections that are in use.
   */
  async hasStudents(sectionId: string): Promise<boolean> {
    const count = await this.countStudentsInSection(sectionId);
    return count > 0;
  }
}
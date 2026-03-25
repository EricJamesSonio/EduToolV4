// @/modules/school-year/school-year.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SchoolYearRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: { orgId: string; name: string }) {
    return this.db.schoolYear.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        status: 'pending', // always starts as pending
      },
    });
  }

  async findAll(orgId: string) {
    return this.db.schoolYear.findMany({
      where: { org_id: orgId },
      orderBy: { name: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { id, org_id: orgId },
    });
  }

  /**
   * Find the currently active school year for the org.
   * There should only ever be one — enforced at service level.
   */
  async findActive(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: 'active' },
    });
  }

  /**
   * Count how many active school years exist for the org.
   * Used to guard against activating a second one simultaneously.
   */
  async countActive(orgId: string): Promise<number> {
    return this.db.schoolYear.count({
      where: { org_id: orgId, status: 'active' },
    });
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'ended') {
    return this.db.schoolYear.update({
      where: { id },
      data: { status },
    });
  }

  async updateName(id: string, name: string) {
    return this.db.schoolYear.update({
      where: { id },
      data: { name },
    });
  }
}
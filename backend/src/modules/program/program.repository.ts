// @/modules/program/program.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class ProgramRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: { orgId: string; name: string; type: string }) {
    return this.db.program.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        type: data.type,
      },
    });
  }

  async findAll(orgId: string) {
    return this.db.program.findMany({
      where: { org_id: orgId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.program.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findByNameAndOrg(name: string, orgId: string) {
    return this.db.program.findFirst({
      where: { name, org_id: orgId },
    });
  }

  async update(id: string, data: { name?: string; type?: string }) {
    return this.db.program.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.db.program.delete({ where: { id } });
  }

  /**
   * Check if any levels reference this program.
   * Used before deletion to prevent orphaned levels.
   */
  async hasLevels(programId: string): Promise<boolean> {
    const count = await this.db.level.count({
      where: { program_id: programId },
    });
    return count > 0;
  }
}
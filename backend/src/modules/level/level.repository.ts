import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class LevelRepository {
  constructor(private readonly db: DatabaseService) {}

  async findDefaultsByOrgId(orgId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId, school_year_id: null }, // defaults have no school year
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    });
  }

  async upsertDefaults(
    orgId: string,
    levels: Array<{ id?: string; programId: string; name: string }>,
  ) {
    const ops = levels.map((level) => {
      if (level.id) {
        return this.db.level.update({
          where: { id: level.id },
          data: { name: level.name },
        });
      }
      return this.db.level.create({
        data: {
          org_id: orgId,
          program_id: level.programId,
          name: level.name,
          school_year_id: null, // explicitly a default
        },
      });
    });
    return this.db.$transaction(ops);
  }

  // ✅ Fixed: now actually filters by school_year_id
  async findBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    });
  }

  async seedFromDefaults(orgId: string, schoolYearId: string) {
    const defaults = await this.findDefaultsByOrgId(orgId);
    if (defaults.length === 0) return [];

    const ops = defaults.map((level) =>
      this.db.level.create({
        data: {
          org_id: orgId,
          program_id: level.program_id,
          name: level.name,
          school_year_id: schoolYearId,
        },
      }),
    );
    return this.db.$transaction(ops);
  }

  async findById(id: string, orgId: string) {
    return this.db.level.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async update(id: string, data: { name?: string }) {
    return this.db.level.update({
      where: { id }, // ✅ Fixed: Prisma delete/update only accepts unique field
      data,
    });
  }

  async create(orgId: string, data: { programId: string; schoolYearId: string; name: string }) {
    return this.db.level.create({
      data: {
        org_id: orgId,
        program_id: data.programId,
        school_year_id: data.schoolYearId,
        name: data.name,
      },
    });
  }

  // ✅ Fixed: Prisma delete requires unique field only
  async delete(id: string) {
    return this.db.level.delete({
      where: { id },
    });
  }

  async findAll(orgId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    });
  }
}
// @/modules/level/level.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class LevelRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Defaults (no school year scope) ────────────────────────────────────────

  /**
   * Fetch all level defaults for the org.
   * "Defaults" are Level rows that have no school_year_id — they act as
   * the template for new school years.
   *
   * NOTE: The current Prisma schema stores Level with org_id and program_id
   * but no school_year_id column. In Phase 3 when school-year seeding is wired,
   * a school_year_id column will be added. For Phase 2, all Level rows
   * belonging to an org without a school_year_id are treated as defaults.
   */
  async findDefaultsByOrgId(orgId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Upsert the full defaults list for an org.
   * - Rows with an existing id are updated.
   * - Rows without an id are created.
   * All within a single transaction.
   */
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
        },
      });
    });

    return this.db.$transaction(ops);
  }

  // ── School-year scoped levels ───────────────────────────────────────────────

  /**
   * Find all levels for a specific school year within the org.
   * Phase 2 stub: returns all org levels (school_year_id filtering added in Phase 3).
   */
  async findBySchoolYear(orgId: string, schoolYearId: string) {
    // Phase 3: add WHERE school_year_id = schoolYearId once the column exists
    return this.db.level.findMany({
      where: { org_id: orgId },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    });
  }

  // ── Single level ────────────────────────────────────────────────────────────

  /**
   * Deep-clone the org's level defaults into a new school year.
   * Each default level row is copied with the school_year_id attached.
   * Phase 3: requires school_year_id column on Level model.
   *
   * Schema addition needed:
   *   model Level {
   *     ...
   *     school_year_id String?  // null = default template, set = school year copy
   *   }
   */
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

  async update(id: string, orgId: string, data: { name?: string }) {
    return this.db.level.update({
      where: { id },
      data,
    });
  }
async create(orgId: string, data: { programId: string; schoolYearId: string; name: string }) {
  return this.db.level.create({
    data: {
      org_id: orgId,
      program_id: data.programId,      // ← camelCase in, snake_case to DB
      school_year_id: data.schoolYearId,
      name: data.name,
    },
  });
}

async delete(id: string, orgId: string) {
  return this.db.level.delete({
    where: { id, org_id: orgId },
  });
}
async findAll(orgId: string) {
  return this.db.level.findMany({
    where: { org_id: orgId },
    orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
  });
}
}
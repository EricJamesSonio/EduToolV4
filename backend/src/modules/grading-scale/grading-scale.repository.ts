import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingScaleRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    programId: string; // CHANGED from levelId → programId
    schoolYearId: string;
    name: string;
    ranges: object;
  }) {
    return this.db.gradingScale.create({
      data: {
        org_id: data.orgId,
        program_id: data.programId, // CHANGED from level_id → program_id
        school_year_id: data.schoolYearId,
        name: data.name,
        ranges: data.ranges,
        is_locked: false,
        locked_at: null,
      },
    });
  }

  async findAll(orgId: string, programId?: string, schoolYearId?: string) {
    // CHANGED: levelId → programId parameter
    return this.db.gradingScale.findMany({
      where: {
        org_id: orgId,
        ...(programId ? { program_id: programId } : {}), // CHANGED
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.gradingScale.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findByProgramAndYear(
    orgId: string,
    programId: string, // CHANGED from levelId → programId
    schoolYearId: string,
  ) {
    return this.db.gradingScale.findFirst({
      where: {
        org_id: orgId,
        program_id: programId, // CHANGED from level_id → program_id
        school_year_id: schoolYearId,
      },
    });
  }

  async update(id: string, data: { name?: string; ranges?: object }) {
    return this.db.gradingScale.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.ranges !== undefined ? { ranges: data.ranges } : {}),
      },
    });
  }

  async lock(id: string) {
    return this.db.gradingScale.update({
      where: { id },
      data: { is_locked: true, locked_at: new Date() },
    });
  }

  async unlock(id: string) {
    return this.db.gradingScale.update({
      where: { id },
      data: { is_locked: false, locked_at: null },
    });
  }

  async unlockAllForSchoolYear(schoolYearId: string, orgId: string) {
    return this.db.gradingScale.updateMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      data: { is_locked: false, locked_at: null },
    });
  }
}
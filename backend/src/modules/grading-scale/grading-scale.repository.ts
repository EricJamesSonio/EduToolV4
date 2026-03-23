// src/modules/grading-scale/grading-scale.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class GradingScaleRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    levelId: string;
    schoolYearId: string;
    name: string;
    ranges: object;
  }) {
    return this.db.gradingScale.create({
      data: {
        org_id: data.orgId,
        level_id: data.levelId,
        school_year_id: data.schoolYearId,
        name: data.name,
        ranges: data.ranges,
        is_locked: false,
        locked_at: null,
      },
    });
  }

  async findAll(orgId: string, levelId?: string, schoolYearId?: string) {
    return this.db.gradingScale.findMany({
      where: {
        org_id: orgId,
        ...(levelId ? { level_id: levelId } : {}),
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

  async findByLevelAndYear(
    orgId: string,
    levelId: string,
    schoolYearId: string,
  ) {
    return this.db.gradingScale.findFirst({
      where: { org_id: orgId, level_id: levelId, school_year_id: schoolYearId },
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
}
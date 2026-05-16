import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingScaleRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    programId: string;
    schoolYearId: string;
    name: string;
    ranges: object;
  }) {
    return this.db.gradingScale.create({
      data: {
        org_id: data.orgId,
        program_id: data.programId,
        school_year_id: data.schoolYearId,
        name: data.name,
        ranges: data.ranges,
        is_locked: false,
        locked_at: null,
      },
    });
  }

  async findAll(orgId: string, programId?: string, schoolYearId?: string) {
    return this.db.gradingScale.findMany({
      where: {
        org_id: orgId,
        ...(programId ? { program_id: programId } : {}),
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
    programId: string,
    schoolYearId: string,
  ) {
    return this.db.gradingScale.findFirst({
      where: {
        org_id: orgId,
        program_id: programId,
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

  async delete(id: string) {
    return this.db.gradingScale.delete({
      where: { id },
    });
  }

  async isUsedInGrades(
    orgId: string,
    programId: string,
    schoolYearId: string,
  ): Promise<boolean> {
    const count = await this.db.grade.count({
      where: {
        org_id: orgId,
        class: {
          school_year_id: schoolYearId,
          subject: {
            program_id: programId,
          },
        },
      },
    });

    return count > 0;
  }

  /**
   * Assign a scale to a program by updating the program_id
   * This effectively "moves" the scale from one program to another
   */
  async assignToProgram(
    scaleId: string,
    programId: string,
    schoolYearId: string,
  ) {
    return this.db.gradingScale.update({
      where: { id: scaleId },
      data: {
        program_id: programId,
        school_year_id: schoolYearId,
      },
    });
  }

  /**
   * Get the program and school year of a scale
   * Used to find what it was previously assigned to
   */
  async getScaleContext(id: string): Promise<{ program_id: string; school_year_id: string } | null> {
    const scale = await this.db.gradingScale.findFirst({
      where: { id },
      select: { program_id: true, school_year_id: true },
    });
    return scale;
  }
}
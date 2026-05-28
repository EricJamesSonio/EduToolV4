import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingScaleAssignmentRepository {
  constructor(private readonly db: DatabaseService) {}

  async findBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.gradingScaleAssignment.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      include: {
        grading_scale: { select: { name: true } },
        program: { select: { name: true } },
      },
    });
  }

  async upsert(
    orgId: string,
    scaleId: string,
    programId: string,
    schoolYearId: string,
  ) {
    return this.db.gradingScaleAssignment.upsert({
      where: {
        program_id_school_year_id: {
          program_id: programId,
          school_year_id: schoolYearId,
        },
      },
      create: {
        org_id: orgId,
        grading_scale_id: scaleId,
        program_id: programId,
        school_year_id: schoolYearId,
      },
      update: {
        grading_scale_id: scaleId,
      },
    });
  }

  async findByProgramAndYear(orgId: string, programId: string, schoolYearId: string) {
    return this.db.gradingScaleAssignment.findFirst({
      where: {
        org_id: orgId,
        program_id: programId,
        school_year_id: schoolYearId,
      },
      include: { grading_scale: true },
    });
  }

  async remove(orgId: string, programId: string, schoolYearId: string) {
    return this.db.gradingScaleAssignment.deleteMany({
      where: {
        org_id: orgId,
        program_id: programId,
        school_year_id: schoolYearId,
      },
    });
  }

  async findByScaleId(scaleId: string) {
    return this.db.gradingScaleAssignment.findMany({
      where: { grading_scale_id: scaleId },
      select: {
        program_id: true,
        school_year_id: true,
      },
    });
  }
}

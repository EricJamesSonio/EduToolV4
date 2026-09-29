// @/modules/semester/semester.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SemesterRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Semester CRUD ───────────────────────────────────────────────────────────

  async create(data: {
    orgId: string;
    schoolYearId: string;
    programId: string;
    templateSemesterId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }) {
    return this.db.semester.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        program_id: data.programId,
        template_semester_id: data.templateSemesterId,
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
      },
    });
  }

  async findAll(orgId: string) {
    return this.db.semester.findMany({
      where: { org_id: orgId },
      include: { terms: true },
      orderBy: { start_date: 'asc' },
    });
  }

  async findBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.semester.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      include: { terms: true },
      orderBy: { start_date: 'asc' },
    });
  }

  /** Semesters for one program in one school year — the actual per-department calendar. */
  async findByProgramAndSchoolYear(
    orgId: string,
    schoolYearId: string,
    programId: string,
  ) {
    return this.db.semester.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId, program_id: programId },
      include: { terms: true },
      orderBy: { start_date: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.semester.findFirst({
      where: { id, org_id: orgId },
      include: { terms: true },
    });
  }

  /**
   * Find all semesters for the SAME program in the same school year (for
   * overlap checking). Scoped by program — two different programs' semesters
   * are allowed to overlap in real dates, since each department runs its own
   * academic calendar. Excludes the current semester if updating.
   */
  async findSiblingsInSchoolYear(
    orgId: string,
    schoolYearId: string,
    programId: string,
    excludeId?: string,
  ) {
    return this.db.semester.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countByProgramAndSchoolYear(
    orgId: string,
    schoolYearId: string,
    programId: string,
  ): Promise<number> {
    return this.db.semester.count({
      where: { org_id: orgId, school_year_id: schoolYearId, program_id: programId },
    });
  }

  async update(
    id: string,
    data: { name?: string; startDate?: Date; endDate?: Date },
  ) {
    return this.db.semester.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.startDate ? { start_date: data.startDate } : {}),
        ...(data.endDate ? { end_date: data.endDate } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.db.semester.delete({ where: { id } });
  }

  // ── Term CRUD ───────────────────────────────────────────────────────────────

  async createTerm(data: {
    orgId: string;
    semesterId: string;
    name: string;
    orderIndex: number;
    startDate: Date;
    endDate: Date;
  }) {
    return this.db.term.create({
      data: {
        org_id: data.orgId,
        semester_id: data.semesterId,
        name: data.name,
        order_index: data.orderIndex,
        start_date: data.startDate,
        end_date: data.endDate,
      },
    });
  }

  async upsertTerms(
    orgId: string,
    semesterId: string,
    terms: Array<{
      id?: string;
      name: string;
      orderIndex: number;
      startDate: Date;
      endDate: Date;
    }>,
  ) {
    const ops = terms.map((term) => {
      if (term.id) {
        return this.db.term.update({
          where: { id: term.id },
          data: {
            name: term.name,
            order_index: term.orderIndex,
            start_date: term.startDate,
            end_date: term.endDate,
          },
        });
      }

      return this.db.term.create({
        data: {
          org_id: orgId,
          semester_id: semesterId,
          name: term.name,
          order_index: term.orderIndex,
          start_date: term.startDate,
          end_date: term.endDate,
        },
      });
    });

    return this.db.$transaction(ops);
  }

  async findTermsBySemester(semesterId: string) {
    return this.db.term.findMany({
      where: { semester_id: semesterId },
      orderBy: { order_index: 'asc' },
    });
  }

  async deleteTermsBySemester(semesterId: string) {
    return this.db.term.deleteMany({ where: { semester_id: semesterId } });
  }
}
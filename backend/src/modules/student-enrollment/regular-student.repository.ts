import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export const REGULAR_SOURCE = 'regular';
export const REGULAR_CLOSE_REASON = 'Regular student - lower year level';

@Injectable()
export class RegularStudentRepository {
  constructor(private readonly db: DatabaseService) {}

  findProgramEnrollment(id: string, orgId: string) {
    return this.db.studentProgramEnrollment.findFirst({
      where: { id, org_id: orgId },
      include: {
        program: { select: { type: true } },
        level: { select: { id: true, name: true } },
        studentSchoolYear: {
          select: { student_id: true, school_year_id: true },
        },
      },
    });
  }

  findCandidateSubjects(orgId: string, programId: string) {
    const inProgram = { program_id: programId };
    return this.db.subject.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        OR: [
          { program_id: programId },
          { course: inProgram },
          { strand: inProgram },
          { level: inProgram },
          {
            sharings: {
              some: {
                OR: [
                  { course: inProgram },
                  { strand: inProgram },
                  { level: inProgram },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        year_level: true,
        course_id: true,
        strand_id: true,
        level: {
          select: { name: true, course_id: true, strand_id: true },
        },
        sharings: { select: { course_id: true, strand_id: true } },
      },
    });
  }

  async findPrerequisiteIds(
    orgId: string,
    subjectIds: string[],
  ): Promise<string[]> {
    if (subjectIds.length === 0) return [];
    const rows = await this.db.subjectPrerequisite.findMany({
      where: { org_id: orgId, subject_id: { in: subjectIds } },
      select: { prerequisite_id: true },
    });
    return [...new Set(rows.map((r) => r.prerequisite_id))];
  }

  async findActiveSubjectIds(
    orgId: string,
    subjectIds: string[],
  ): Promise<string[]> {
    if (subjectIds.length === 0) return [];
    const rows = await this.db.subject.findMany({
      where: { org_id: orgId, deleted_at: null, id: { in: subjectIds } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async findOverrides(
    orgId: string,
    studentId: string,
    subjectIds: string[],
  ) {
    if (subjectIds.length === 0) {
      return [] as { subject_id: string; source: string; status: string }[];
    }
    return this.db.subjectCompletionOverride.findMany({
      where: {
        org_id: orgId,
        student_id: studentId,
        subject_id: { in: subjectIds },
      },
      select: { subject_id: true, source: true, status: true },
    });
  }

  markRegular(params: {
    programEnrollmentId: string;
    orgId: string;
    studentId: string;
    actorId: string;
    schoolYearId: string;
    keepSubjectIds: string[];
    createSubjectIds: string[];
    closeSubjectIds: string[];
  }): Promise<{ created: number; closed: number }> {
    return this.db.$transaction(async (tx) => {
      await tx.studentProgramEnrollment.update({
        where: { id: params.programEnrollmentId },
        data: {
          is_regular: true,
          regular_marked_at: new Date(),
          regular_marked_by: params.actorId,
        },
      });

      await tx.subjectCompletionOverride.deleteMany({
        where: {
          org_id: params.orgId,
          student_id: params.studentId,
          source: REGULAR_SOURCE,
          status: 'completed',
          subject_id: { notIn: params.keepSubjectIds },
        },
      });

      let created = 0;
      if (params.createSubjectIds.length > 0) {
        const result = await tx.subjectCompletionOverride.createMany({
          data: params.createSubjectIds.map((subjectId) => ({
            org_id: params.orgId,
            student_id: params.studentId,
            subject_id: subjectId,
            status: 'completed',
            reason: 'Regular student',
            actor_id: params.actorId,
            source: REGULAR_SOURCE,
          })),
          skipDuplicates: true,
        });
        created = result.count;
      }

      let closed = 0;
      if (params.closeSubjectIds.length > 0) {
        const result = await tx.enrollment.updateMany({
          where: {
            org_id: params.orgId,
            student_id: params.studentId,
            status: 'active',
            class: {
              school_year_id: params.schoolYearId,
              subject_id: { in: params.closeSubjectIds },
              deleted_at: null,
            },
          },
          data: {
            status: 'removed',
            outcome: 'completed',
            outcome_reason: REGULAR_CLOSE_REASON,
            outcome_set_at: new Date(),
            outcome_set_by: params.actorId,
          },
        });
        closed = result.count;
      }

      return { created, closed };
    });
  }

  unmarkRegular(params: {
    programEnrollmentId: string;
    orgId: string;
    studentId: string;
  }): Promise<number> {
    return this.db.$transaction(async (tx) => {
      await tx.studentProgramEnrollment.update({
        where: { id: params.programEnrollmentId },
        data: {
          is_regular: false,
          regular_marked_at: null,
          regular_marked_by: null,
        },
      });

      const removed = await tx.subjectCompletionOverride.deleteMany({
        where: {
          org_id: params.orgId,
          student_id: params.studentId,
          source: REGULAR_SOURCE,
          status: 'completed',
        },
      });
      return removed.count;
    });
  }
}
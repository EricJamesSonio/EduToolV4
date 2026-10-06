import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import type { StudentAcademicStructure } from './enrollment-eligibility.util';

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly db: DatabaseService) {}

  // Fetches the academic context of a class needed for eligibility checks.
  async findClassEnrollmentContext(classId: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: { subject_id: true, school_year_id: true, section_id: true },
    });
  }

  // Resolves a student's active program enrollment for a given school year.
  // Returns null when the student has no (or no complete) academic placement,
  // in which case they must be treated as ineligible.
  async findStudentAcademicStructure(
    studentId: string,
    orgId: string,
    schoolYearId: string,
  ): Promise<StudentAcademicStructure | null> {
    const ssy = await this.db.studentSchoolYear.findFirst({
      where: {
        org_id: orgId,
        student_id: studentId,
        school_year_id: schoolYearId,
      },
      include: {
        programEnrollments: {
          where: { status: 'active' },
        },
      },
    });

    const pe = ssy?.programEnrollments?.[0];
    if (!pe) return null;

    return {
      programId: pe.program_id,
      levelId: pe.level_id,
      courseId: pe.course_id,
      strandId: pe.strand_id,
      sectionId: pe.section_id,
    };
  }

  async create(data: {
    orgId: string;
    classId: string;
    studentId: string;
    status: string;
  }) {
    return this.db.enrollment.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        student_id: data.studentId,
        status: data.status as any,
      },
    });
  }

  async findByClass(classId: string, orgId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        status: { not: 'removed' },
      },
      orderBy: { created_at: 'asc' },
    });

    if (enrollments.length === 0) return [];

    const studentIds = enrollments.map((e) => e.student_id);
    const accounts = await this.db.account.findMany({
      where: { id: { in: studentIds }, org_id: orgId, role: 'student' },
      select: {
        id: true,
        profile: { select: { full_name: true } },
      },
    });

    const nameMap = new Map(
      accounts.map((a) => [a.id, a.profile?.full_name ?? null]),
    );

    return enrollments.map((e) => ({
      ...e,
      student_name: nameMap.get(e.student_id) ?? null,
    }));
  }

  async findById(id: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findByStudent(classId: string, studentId: string, orgId: string) {
    return this.db.enrollment.findFirst({
      where: { class_id: classId, student_id: studentId, org_id: orgId },
    });
  }

  // Checks if student is already enrolled in the same subject within the same semester
  // Prevents duplicate enrollment across parallel classes for the same subject
  async findDuplicate(
    studentId: string,
    subjectId: string,
    semesterId: string,
    orgId: string,
  ) {
    return this.db.enrollment.findFirst({
      where: {
        org_id: orgId,
        student_id: studentId,
        status: { not: 'removed' },
        class: {
          subject_id: subjectId,
          semester_id: semesterId,
          deleted_at: null,
        },
      },
    });
  }

  async countActive(classId: string): Promise<number> {
    return this.db.enrollment.count({
      where: { class_id: classId, status: 'active' },
    });
  }

  async countActiveMany(
    classIds: string[],
    orgId: string,
  ): Promise<Map<string, number>> {
    if (classIds.length === 0) return new Map();
    const rows = await this.db.enrollment.groupBy({
      by: ['class_id'],
      where: {
        org_id: orgId,
        class_id: { in: [...new Set(classIds)] },
        status: 'active',
      },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.class_id, r._count._all]));
  }

  async updateStatus(id: string, status: string) {
    return this.db.enrollment.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async remove(id: string) {
    return this.db.enrollment.update({
      where: { id },
      data: { status: 'removed' as any },
    });
  }

  async findByStudentAcrossOrg(studentId: string, orgId: string) {
    return this.db.enrollment.findMany({
      where: {
        student_id: studentId,
        org_id: orgId,
        status: 'active',
        class: { deleted_at: null },
      },
      include: {
        class: {
          include: {
            schedules: true,
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOneByStudentAndClass(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    return this.db.enrollment.findFirst({
      where: {
        class_id: classId,
        student_id: studentId,
        org_id: orgId,
        status: 'active',
        class: { deleted_at: null },
      },
      include: {
        class: {
          include: { schedules: true },
        },
      },
    });
  }
}

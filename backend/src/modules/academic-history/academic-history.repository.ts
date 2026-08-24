import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AcademicHistoryRepository {
  constructor(private readonly db: DatabaseService) {}

  async getStudentSchoolYears(studentId: string, orgId: string, schoolYearId?: string) {
    return this.db.studentSchoolYear.findMany({
      where: {
        student_id: studentId,
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      include: {
        schoolYear: { select: { id: true, name: true, status: true } },
        programEnrollments: {
          include: {
            program: { select: { id: true, name: true, type: true } },
            level: { select: { id: true, name: true } },
            course: { select: { id: true, name: true } },
            strand: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            shiftFromEvent: true,
            shiftToEvent: true,
          },
          orderBy: { enrolled_at: 'asc' },
        },
      },
      orderBy: { enrolled_at: 'asc' },
    });
  }

  async getEnrollments(studentId: string, orgId: string, schoolYearId?: string) {
    const where: Record<string, unknown> = {
      student_id: studentId,
      org_id: orgId,
    };
    if (schoolYearId) {
      where.class = { school_year_id: schoolYearId, deleted_at: null };
    } else {
      where.class = { deleted_at: null };
    }
    return this.db.enrollment.findMany({
      where: where as never,
      include: {
        class: {
          include: {
            subject: { select: { id: true, name: true } },
            educator: { include: { profile: { select: { full_name: true } } } },
          },
        },
        shiftEvent: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async getShiftEvents(studentId: string, orgId: string, schoolYearId?: string) {
    // shift events are linked via student_school_year_id
    const ssyIds = (
      await this.db.studentSchoolYear.findMany({
        where: { student_id: studentId, org_id: orgId, ...(schoolYearId ? { school_year_id: schoolYearId } : {}) },
        select: { id: true },
      })
    ).map((r) => r.id);
    if (ssyIds.length === 0) return [];
    return this.db.programShiftEvent.findMany({
      where: { student_school_year_id: { in: ssyIds }, org_id: orgId },
      orderBy: { created_at: 'asc' },
    });
  }

  async getClassAssignmentRequests(studentId: string, orgId: string, schoolYearId?: string) {
    const where: Record<string, unknown> = {
      student_id: studentId,
      org_id: orgId,
    };
    if (schoolYearId) {
      where.studentSchoolYear = { school_year_id: schoolYearId };
    }
    return this.db.classAssignmentRequest.findMany({
      where: where as never,
      orderBy: { created_at: 'asc' },
    });
  }
}

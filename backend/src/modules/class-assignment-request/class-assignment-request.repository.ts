import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClassAssignmentRequestRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.ClassAssignmentRequestCreateInput) {
    return this.db.classAssignmentRequest.create({ data });
  }

  findById(id: string, orgId: string) {
    return this.db.classAssignmentRequest.findFirst({
      where: { id, org_id: orgId },
    });
  }

  findPendingByStudentSchoolYear(studentSchoolYearId: string, orgId: string) {
    return this.db.classAssignmentRequest.findFirst({
      where: {
        student_school_year_id: studentSchoolYearId,
        org_id: orgId,
        status: 'pending_review',
      },
    });
  }

  findMany(orgId: string, filters: Prisma.ClassAssignmentRequestWhereInput, page = 1, limit = 20) {
    const where: Prisma.ClassAssignmentRequestWhereInput = { org_id: orgId, ...filters };
    return Promise.all([
      this.db.classAssignmentRequest.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.classAssignmentRequest.count({ where }),
    ]);
  }

  finalize(id: string, adminFinalizedSubjectIds: string[], actorId: string) {
    return this.db.classAssignmentRequest.update({
      where: { id },
      data: {
        admin_finalized_subject_ids: adminFinalizedSubjectIds,
        status: 'ready',
        finalized_at: new Date(),
        finalized_by: actorId,
        reopen_reason: null,
      },
    });
  }

  reopen(id: string, reason?: string) {
    return this.db.classAssignmentRequest.update({
      where: { id },
      data: {
        status: 'pending_review',
        finalized_at: null,
        finalized_by: null,
        reopen_reason: reason ?? null,
      },
    });
  }

  // For batch guard: get all pending student ids for a school year
  findPendingStudentIds(orgId: string, schoolYearId: string) {
    return this.db.classAssignmentRequest.findMany({
      where: {
        org_id: orgId,
        status: 'pending_review',
        studentSchoolYear: { school_year_id: schoolYearId },
      },
      select: { student_id: true },
    });
  }
}

// src/modules/enrollment-portal/registrar/enrollment-approval.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma, EnrollmentApplicationStatus } from '@prisma/client';

export interface SectionSelection {
  orgId: string;
  schoolYearId: string;
  levelId: string;
  courseId: string | null;
  strandId: string | null;
}

@Injectable()
export class EnrollmentApprovalRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Candidate sections for a program/level (+ course/strand when applicable),
   * ordered by fill order (order_index then name), including the current count
   * of active program enrollments per section so the caller can pick the first
   * one with remaining capacity.
   */
  async findEligibleSections(sel: SectionSelection) {
    const courseFilter = sel.courseId ? { course_id: sel.courseId } : { course_id: null };
    const strandFilter = sel.strandId ? { strand_id: sel.strandId } : { strand_id: null };

    return this.db.section.findMany({
      where: {
        org_id: sel.orgId,
        school_year_id: sel.schoolYearId,
        level_id: sel.levelId,
        deleted_at: null,
        AND: [courseFilter, strandFilter],
      },
      orderBy: [{ order_index: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        capacity: true,
        _count: {
          select: {
            studentEnrollments: { where: { status: 'active' } },
          },
        },
      },
    });
  }

  /**
   * First section whose active student-enrollment count is below capacity.
   * Returns null when every eligible section is full (approval still proceeds,
   * section is left null and registrars are notified).
   */
  async assignFirstAvailableSection(sel: SectionSelection) {
    const sections = await this.findEligibleSections(sel);
    for (const section of sections) {
      if (section._count.studentEnrollments < section.capacity) {
        return section;
      }
    }
    return null;
  }

  approveInTx(
    tx: Prisma.TransactionClient,
    applicationId: string,
    actorId: string,
    resultingAccountId: string,
  ) {
    return tx.enrollmentApplication.update({
      where: { id: applicationId },
      data: {
        status: EnrollmentApplicationStatus.approved,
        resulting_account_id: resultingAccountId,
        reviewed_by: actorId,
        reviewed_at: new Date(),
      },
    });
  }

  findRegistrarAccounts(orgId: string) {
    return this.db.account.findMany({
      where: { org_id: orgId, is_registrar: true },
      select: { id: true },
    });
  }
}
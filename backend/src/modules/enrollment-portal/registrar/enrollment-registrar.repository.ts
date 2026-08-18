// src/modules/enrollment-portal/registrar/enrollment-registrar.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  EnrollmentApplicationStatus,
  SectionOverflowAction,
} from '@prisma/client';

export interface CreatePeriodData {
  orgId: string;
  schoolYearId: string;
  name: string;
  token: string;
  startDate: Date;
  endDate: Date;
  lockDate: Date;
  createdBy: string;
  sectionOverflowAction?: SectionOverflowAction;
}

export interface SearchApplicationsFilters {
  orgId: string;
  applicationCode?: string;
  personalEmail?: string;
  status?: EnrollmentApplicationStatus;
  periodId?: string;
  page: number;
  limit: number;
}

@Injectable()
export class EnrollmentRegistrarRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Periods ──────────────────────────────────────────────────────────────

  findSchoolYear(orgId: string, schoolYearId: string) {
    return this.db.schoolYear.findFirst({
      where: { id: schoolYearId, org_id: orgId },
      select: { id: true, name: true, start_date: true, status: true },
    });
  }

  findOrgInfo(orgId: string) {
    return this.db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true },
    });
  }

  findPeriodByToken(orgId: string, token: string) {
    return this.db.enrollmentPeriod.findFirst({
      where: { org_id: orgId, token },
      select: { id: true },
    });
  }

  createPeriod(data: CreatePeriodData) {
    return this.db.enrollmentPeriod.create({
      data: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        name: data.name,
        token: data.token,
        start_date: data.startDate,
        end_date: data.endDate,
        lock_date: data.lockDate,
        created_by: data.createdBy,
        section_overflow_action:
          data.sectionOverflowAction ?? SectionOverflowAction.no_section,
      },
    });
  }

  findPeriods(orgId: string) {
    return this.db.enrollmentPeriod.findMany({
      where: { org_id: orgId },
      include: { schoolYear: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  findPeriodById(orgId: string, id: string) {
    return this.db.enrollmentPeriod.findFirst({
      where: { id, org_id: orgId },
      include: { schoolYear: { select: { id: true, start_date: true } } },
    });
  }

  updatePeriod(
    id: string,
    data: {
      name?: string;
      start_date?: Date;
      end_date?: Date;
      lock_date?: Date;
      section_overflow_action?: SectionOverflowAction;
    },
  ) {
    return this.db.enrollmentPeriod.update({
      where: { id },
      data,
    });
  }

  countApplicationsByPeriod(orgId: string, periodId: string) {
    return this.db.enrollmentApplication.count({
      where: { org_id: orgId, enrollment_period_id: periodId },
    });
  }

  countApplicationsByPeriodStatus(orgId: string) {
    return this.db.enrollmentApplication.groupBy({
      by: ['enrollment_period_id', 'status'],
      where: { org_id: orgId },
      _count: { _all: true },
    });
  }

  deletePeriod(id: string) {
    return this.db.enrollmentPeriod.delete({ where: { id } });
  }

  // ── Applications ─────────────────────────────────────────────────────────

  async searchApplications(filters: SearchApplicationsFilters) {
    const { orgId, page, limit } = filters;
    const where = {
      org_id: orgId,
      ...(filters.applicationCode
        ? {
            application_code: {
              equals: filters.applicationCode,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.personalEmail
        ? {
            personal_email: {
              equals: filters.personalEmail,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.periodId ? { enrollment_period_id: filters.periodId } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.enrollmentApplication.findMany({
        where,
        include: {
          program: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
          strand: { select: { id: true, name: true } },
          level: { select: { id: true, name: true } },
          enrollmentPeriod: { select: { id: true, name: true, token: true } },
        },
        orderBy: { submitted_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.enrollmentApplication.count({ where }),
    ]);

    return { data, total };
  }

  findApplicationDetail(orgId: string, id: string) {
    return this.db.enrollmentApplication.findFirst({
      where: { id, org_id: orgId },
      include: {
        program: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        strand: { select: { id: true, name: true } },
        level: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        enrollmentPeriod: {
          select: {
            id: true,
            name: true,
            token: true,
            section_overflow_action: true,
          },
        },
        schoolYear: { select: { id: true, name: true } },
      },
    });
  }

  findApplicationByEmail(orgId: string, personalEmail: string) {
    return this.db.enrollmentApplication.findFirst({
      where: {
        org_id: orgId,
        personal_email: { equals: personalEmail, mode: 'insensitive' },
      },
    });
  }

  findApplicationByCode(orgId: string, applicationCode: string) {
    return this.db.enrollmentApplication.findFirst({
      where: {
        org_id: orgId,
        application_code: { equals: applicationCode, mode: 'insensitive' },
      },
    });
  }

  findApplicationForUnlock(
    orgId: string,
    opts: { personalEmail?: string; applicationCode?: string },
  ) {
    const where = opts.applicationCode
      ? {
          application_code: {
            equals: opts.applicationCode,
            mode: 'insensitive' as const,
          },
        }
      : {
          personal_email: {
            equals: opts.personalEmail as string,
            mode: 'insensitive' as const,
          },
        };
    return this.db.enrollmentApplication.findFirst({
      where: { org_id: orgId, ...where },
    });
  }

  setReviewDecision(
    id: string,
    data: {
      status: EnrollmentApplicationStatus;
      reviewedBy: string;
      rejectionReason?: string | null;
    },
  ) {
    return this.db.enrollmentApplication.update({
      where: { id },
      data: {
        status: data.status,
        reviewed_by: data.reviewedBy,
        reviewed_at: new Date(),
        ...(data.rejectionReason !== undefined
          ? { rejection_reason: data.rejectionReason }
          : {}),
      },
    });
  }

  unlockApplication(id: string, actorId: string) {
    return this.db.enrollmentApplication.update({
      where: { id },
      data: {
        status: EnrollmentApplicationStatus.pending,
        unlocked_by: actorId,
        unlocked_at: new Date(),
        locked_at: null,
      },
    });
  }

  // ── Auto-lock sweep (Phase 5) ────────────────────────────────────────────

  findExpiredPendingApplications(now: Date) {
    return this.db.enrollmentApplication.findMany({
      where: {
        status: EnrollmentApplicationStatus.pending,
        enrollmentPeriod: { lock_date: { lte: now } },
      },
      select: {
        id: true,
        org_id: true,
        application_code: true,
        enrollmentPeriod: { select: { name: true, lock_date: true } },
      },
    });
  }

  lockApplication(id: string) {
    return this.db.enrollmentApplication.update({
      where: { id },
      data: {
        status: EnrollmentApplicationStatus.locked,
        locked_at: new Date(),
      },
    });
  }

  // ── Dashboard (Phase: portal overview) ───────────────────────────────────

  findPeriodApplications(orgId: string, periodId: string) {
    return this.db.enrollmentApplication.findMany({
      where: { org_id: orgId, enrollment_period_id: periodId },
      select: {
        program_id: true,
        course_id: true,
        strand_id: true,
        level_id: true,
        status: true,
      },
    });
  }

  findDashboardPrograms(orgId: string, schoolYearId: string) {
    return this.db.program.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      include: {
        courses: {
          where: { org_id: orgId, school_year_id: schoolYearId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            levels: {
              where: { org_id: orgId, school_year_id: schoolYearId },
              orderBy: { name: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
        strands: {
          where: { org_id: orgId, school_year_id: schoolYearId },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            levels: {
              where: { org_id: orgId, school_year_id: schoolYearId },
              orderBy: { name: 'asc' },
              select: { id: true, name: true },
            },
          },
        },
        levels: {
          where: {
            org_id: orgId,
            school_year_id: schoolYearId,
            course_id: null,
            strand_id: null,
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

// src/modules/enrollment-portal/registrar/enrollment-registrar.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentApplicationStatus } from '@prisma/client';
import { generateRandomCode } from '@/commons/utils/random-code.util';
import { AuditLogService } from '@/modules/audit-log/audit-log.service';
import { EnrollmentRegistrarRepository } from './enrollment-registrar.repository';
import { EnrollmentApprovalService } from './enrollment-approval.service';
import {
  CreateEnrollmentPeriodDto,
  UpdateEnrollmentPeriodDto,
  QueryApplicationsDto,
  RejectApplicationDto,
  UnlockApplicationDto,
} from './dto/enrollment-registrar.dto';

const PERIOD_TOKEN_LENGTH = 7;
const MAX_TOKEN_ATTEMPTS = 10;

interface DashboardReference {
  kind: 'course' | 'strand' | 'level';
  id: string;
  levelId: string | null;
  enrolled: boolean;
}

interface DashboardBucket {
  total: number;
  enrolled: number;
  references: DashboardReference[];
}

@Injectable()
export class EnrollmentRegistrarService {
  constructor(
    private readonly repo: EnrollmentRegistrarRepository,
    private readonly auditLogService: AuditLogService,
    private readonly approvalService: EnrollmentApprovalService,
  ) {}

  // ── Period management ────────────────────────────────────────────────────

  async createPeriod(orgId: string, actorId: string, dto: CreateEnrollmentPeriodDto) {
    const schoolYear = await this.repo.findSchoolYear(orgId, dto.school_year_id);
    if (!schoolYear) throw new NotFoundException('School year not found for this organization.');

    this.assertPeriodDates(dto.start_date, dto.end_date, dto.lock_date);
    const token = (await this.generateUniquePeriodToken(orgId)) as string;

    const period = await this.repo.createPeriod({
      orgId,
      schoolYearId: dto.school_year_id,
      name: dto.name,
      token,
      startDate: new Date(dto.start_date),
      endDate: new Date(dto.end_date),
      lockDate: new Date(dto.lock_date),
      createdBy: actorId,
    });

    await this.logAdmin(orgId, actorId, 'ENROLLMENT_PERIOD_CREATE', period.id, {
      name: period.name,
      token: period.token,
    });

    return this.toPeriodView(period);
  }

  async listPeriods(orgId: string) {
    const [periods, org, groupedByPeriod] = await Promise.all([
      this.repo.findPeriods(orgId),
      this.repo.findOrgInfo(orgId),
      this.repo.countApplicationsByPeriodStatus(orgId),
    ]);

    const countsByPeriod = groupedByPeriod.reduce<Record<string, Record<string, number>>>(
      (acc, g) => {
        const key = g.enrollment_period_id;
        acc[key] = acc[key] ?? { pending: 0, locked: 0, approved: 0, rejected: 0 };
        acc[key][g.status] = g._count._all;
        return acc;
      },
      {},
    );

    return {
      org: {
        id: org?.id ?? null,
        name: org?.name ?? null,
        slug: org?.slug ?? null,
      },
      periods: periods.map((p) => {
        const c = countsByPeriod[p.id] ?? { pending: 0, locked: 0, approved: 0, rejected: 0 };
        return {
          id: p.id,
          name: p.name,
          token: p.token,
          start_date: p.start_date,
          end_date: p.end_date,
          lock_date: p.lock_date,
          created_by: p.created_by,
          school_year: p.schoolYear,
          created_at: p.created_at,
          counts: c,
          total: c.pending + c.locked + c.approved + c.rejected,
        };
      }),
    };
  }

  async getDashboard(orgId: string, periodId?: string) {
    const [org, periods, groupedByPeriod] = await Promise.all([
      this.repo.findOrgInfo(orgId),
      this.repo.findPeriods(orgId),
      this.repo.countApplicationsByPeriodStatus(orgId),
    ]);

    const countsByPeriod = groupedByPeriod.reduce<Record<string, Record<string, number>>>(
      (acc, g) => {
        const key = g.enrollment_period_id;
        acc[key] = acc[key] ?? { pending: 0, locked: 0, approved: 0, rejected: 0 };
        acc[key][g.status] = g._count._all;
        return acc;
      },
      {},
    );

    const now = new Date();
    const availablePeriods = periods.map((p) => {
      const counts = countsByPeriod[p.id] ?? { pending: 0, locked: 0, approved: 0, rejected: 0 };
      return {
        id: p.id,
        name: p.name,
        token: p.token,
        start_date: p.start_date,
        end_date: p.end_date,
        lock_date: p.lock_date,
        school_year: p.schoolYear,
        status: this.periodStatus(p, now),
        counts,
        total: counts.pending + counts.locked + counts.approved + counts.rejected,
      };
    });

    let selected = periodId ? periods.find((p) => p.id === periodId) : undefined;
    if (!selected) {
      selected =
        periods.find((p) => new Date(p.start_date) <= now) ??
        periods.find((p) => p.created_at != null) ??
        periods[0];
    }

    if (!selected) {
      return {
        org: this.orgView(org),
        availablePeriods,
        dashboard: null,
      };
    }

    const [applications, programs] = await Promise.all([
      this.repo.findPeriodApplications(orgId, selected.id),
      this.repo.findDashboardPrograms(orgId, selected.school_year_id),
    ]);

    const summary = { pending: 0, locked: 0, approved: 0, rejected: 0 };
    const buckets = new Map<string, DashboardBucket>();

    for (const app of applications) {
      summary[app.status] = (summary[app.status] ?? 0) + 1;
      if (!app.program_id) continue;

      const bucket = buckets.get(app.program_id) ?? { total: 0, enrolled: 0, references: [] };
      buckets.set(app.program_id, bucket);
      bucket.total += 1;
      const enrolled = app.status === 'approved';
      if (enrolled) bucket.enrolled += 1;

      if (app.course_id) {
        bucket.references.push({ kind: 'course', id: app.course_id, levelId: app.level_id, enrolled });
      } else if (app.strand_id) {
        bucket.references.push({ kind: 'strand', id: app.strand_id, levelId: app.level_id, enrolled });
      } else {
        bucket.references.push({ kind: 'level', id: app.level_id, levelId: null, enrolled });
      }
    }

    const programOverview = programs.map((program) => {
      const bucket = buckets.get(program.id) ?? { total: 0, enrolled: 0, references: [] };
      const counts = (kind: string, id: string, levelId: string | null) => {
        const hits = bucket.references.filter(
          (r) => r.kind === kind && r.id === id && r.levelId === levelId,
        );
        return {
          applied: hits.length,
          enrolled: hits.filter((r) => r.enrolled).length,
        };
      };

      return {
        id: program.id,
        name: program.name,
        type: program.type,
        applied: bucket.total,
        approved: bucket.enrolled,
        courses: program.courses.map((course) => {
          const courseCounts = counts('course', course.id, null);
          return {
            id: course.id,
            name: course.name,
            ...courseCounts,
            levels: course.levels.map((level) => {
              const c = counts('course', course.id, level.id);
              return { id: level.id, name: level.name, applied: c.applied, enrolled: c.enrolled };
            }),
          };
        }),
        strands: program.strands.map((strand) => ({
          id: strand.id,
          name: strand.name,
          ...counts('strand', strand.id, null),
        })),
        levels: program.levels.map((level) => ({
          id: level.id,
          name: level.name,
          ...counts('level', level.id, null),
        })),
      };
    });

    return {
      org: this.orgView(org),
      availablePeriods,
      dashboard: {
        period: {
          id: selected.id,
          name: selected.name,
          token: selected.token,
          start_date: selected.start_date,
          end_date: selected.end_date,
          lock_date: selected.lock_date,
          school_year: selected.schoolYear,
          status: this.periodStatus(selected, now),
        },
        summary,
        total: summary.pending + summary.locked + summary.approved + summary.rejected,
        programs: programOverview,
      },
    };
  }

  async updatePeriod(orgId: string, actorId: string, id: string, dto: UpdateEnrollmentPeriodDto) {
    const period = await this.repo.findPeriodById(orgId, id);
    if (!period) throw new NotFoundException('Enrollment period not found.');

    const next = {
      name: dto.name ?? period.name,
      start_date: dto.start_date ? new Date(dto.start_date) : period.start_date,
      end_date: dto.end_date ? new Date(dto.end_date) : period.end_date,
      lock_date: dto.lock_date ? new Date(dto.lock_date) : period.lock_date,
    };
    this.assertPeriodDates(
      next.start_date.toISOString(),
      next.end_date.toISOString(),
      next.lock_date.toISOString(),
    );

    const updated = await this.repo.updatePeriod(id, next);
    await this.logAdmin(orgId, actorId, 'ENROLLMENT_PERIOD_UPDATE', updated.id, {
      name: updated.name,
      token: updated.token,
    });
    return updated;
  }

  async deletePeriod(orgId: string, actorId: string, id: string) {
    const period = await this.repo.findPeriodById(orgId, id);
    if (!period) throw new NotFoundException('Enrollment period not found.');

    const applicationCount = await this.repo.countApplicationsByPeriod(orgId, id);
    if (applicationCount > 0) {
      throw new ConflictException(
        `Cannot delete an enrollment period with ${applicationCount} application(s).`,
      );
    }

    await this.repo.deletePeriod(id);
    await this.logAdmin(orgId, actorId, 'ENROLLMENT_PERIOD_DELETE', id, {
      name: period.name,
    });

    return { success: true };
  }

  // ── Application review ───────────────────────────────────────────────────

  async searchApplications(orgId: string, query: QueryApplicationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.repo.searchApplications({
      orgId,
      applicationCode: query.application_code,
      personalEmail: query.personal_email,
      status: query.status,
      periodId: query.period_id,
      page,
      limit,
    });

    return {
      data: data.map((app) => ({
        id: app.id,
        application_code: app.application_code,
        personal_email: app.personal_email,
        full_name: [app.first_name, app.middle_name, app.last_name]
          .filter(Boolean)
          .join(' '),
        status: app.status,
        program: app.program.name,
        course: app.course?.name ?? null,
        strand: app.strand?.name ?? null,
        level: app.level.name,
        period: app.enrollmentPeriod.name,
        submitted_at: app.submitted_at,
      })),
      page,
      limit,
      total,
    };
  }

  async getApplicationDetail(orgId: string, id: string) {
    const app = await this.repo.findApplicationDetail(orgId, id);
    if (!app) throw new NotFoundException('Application not found.');

    return {
      ...app,
      period: app.enrollmentPeriod,
      school_year: app.schoolYear,
    };
  }

  async approveApplication(orgId: string, actorId: string, id: string) {
    return this.approvalService.approve(orgId, actorId, id);
  }

  async rejectApplication(
    orgId: string,
    actorId: string,
    id: string,
    dto: RejectApplicationDto,
  ) {
    const app = await this.requireReviewable(orgId, id);

    const rejected = await this.repo.setReviewDecision(id, {
      status: EnrollmentApplicationStatus.rejected,
      reviewedBy: actorId,
      rejectionReason: dto.reason,
    });

    await this.logAdmin(orgId, actorId, 'ENROLLMENT_APPLICATION_REJECT', id, {
      application_code: app.application_code,
      personal_email: app.personal_email,
      reason: dto.reason,
    });

    return { success: true, application: this.toApplicationView(rejected) };
  }

  async unlockApplication(orgId: string, actorId: string, dto: UnlockApplicationDto) {
    if (!dto.personal_email && !dto.application_code) {
      throw new BadRequestException(
        'Provide either personal_email or application_code to unlock an application.',
      );
    }

    const app = await this.repo.findApplicationForUnlock(orgId, {
      personalEmail: dto.personal_email,
      applicationCode: dto.application_code,
    });
    if (!app) throw new NotFoundException('Application not found.');

    if (app.status !== EnrollmentApplicationStatus.locked) {
      throw new ConflictException('Application is not locked.');
    }

    const unlocked = await this.repo.unlockApplication(app.id, actorId);

    await this.logAdmin(orgId, actorId, 'ENROLLMENT_APPLICATION_UNLOCK', app.id, {
      personal_email: app.personal_email,
      application_code: app.application_code,
    });

    return { success: true, application: this.toApplicationView(unlocked) };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async requireReviewable(orgId: string, id: string) {
    const app = await this.repo.findApplicationDetail(orgId, id);
    if (!app) throw new NotFoundException('Application not found.');

    if (app.status !== EnrollmentApplicationStatus.pending) {
      throw new ConflictException(
        `Only pending applications can be reviewed (current status: ${app.status}).`,
      );
    }
    return app;
  }

  private async generateUniquePeriodToken(orgId: string) {
    for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
      const token = generateRandomCode(PERIOD_TOKEN_LENGTH);
      const existing = await this.repo.findPeriodByToken(orgId, token);
      if (!existing) return token;
    }
    throw new ConflictException('Could not generate a unique enrollment period token.');
  }

  private assertPeriodDates(start: string, end: string, lock: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const lockDate = new Date(lock);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid period dates.');
    }
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after the start date.');
    }
    if (lockDate <= startDate) {
      throw new BadRequestException('Lock date must be after the start date.');
    }
  }

  private orgView(org: { id?: string | null; name?: string | null; slug?: string | null } | null) {
    return { id: org?.id ?? null, name: org?.name ?? null, slug: org?.slug ?? null };
  }

  private periodStatus(
    period: { start_date: Date; end_date: Date; lock_date: Date },
    now: Date,
  ): 'upcoming' | 'open' | 'locked' | 'ended' {
    if (now < period.start_date) return 'upcoming';
    if (now > period.end_date) return 'ended';
    if (now >= period.lock_date) return 'locked';
    return 'open';
  }

  private toPeriodView(period: {
    id: string;
    name: string;
    token: string;
    start_date: Date;
    end_date: Date;
    lock_date: Date;
    created_by: string;
  }) {
    return {
      id: period.id,
      name: period.name,
      token: period.token,
      start_date: period.start_date,
      end_date: period.end_date,
      lock_date: period.lock_date,
      created_by: period.created_by,
    };
  }

  private toApplicationView(record: {
    id: string;
    application_code: string;
    personal_email: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    status: string;
    program_id: string;
    course_id: string | null;
    strand_id: string | null;
    level_id: string;
    submitted_at: Date;
  }) {
    return {
      id: record.id,
      application_code: record.application_code,
      personal_email: record.personal_email,
      full_name: [record.first_name, record.middle_name, record.last_name]
        .filter(Boolean)
        .join(' '),
      status: record.status,
      program_id: record.program_id,
      course_id: record.course_id,
      strand_id: record.strand_id,
      level_id: record.level_id,
      submitted_at: record.submitted_at,
    };
  }

  private logAdmin(
    orgId: string,
    actorId: string,
    action: string,
    entityId: string,
    metadata: object,
  ) {
    return this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action,
        entityType: 'enrollment_application',
        entityId,
        metadata,
      })
      .catch(() => {});
  }
}
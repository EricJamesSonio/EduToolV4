import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradeAnalyticsQueryDto } from './dto/analytics.dto';
import { SchoolYearEnrollmentStatus } from '@prisma/client';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly db: DatabaseService) {}

  async getActiveSchoolYear(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: 'active' },
      select: { id: true, name: true },
    });
  }

  async countStudents(orgId: string, schoolYearId: string) {
    return this.db.studentSchoolYear.count({
      where: { org_id: orgId, school_year_id: schoolYearId, status: 'active' },
    });
  }

  async countStudentsByStatus(
    orgId: string,
    schoolYearId: string,
    status: SchoolYearEnrollmentStatus,
  ) {
    return this.db.studentSchoolYear.count({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        status,
      },
    });
  }

  async countEducators(orgId: string) {
    return this.db.account.count({
      where: { org_id: orgId, role: 'educator', status: 'active' },
    });
  }

  async countClasses(orgId: string, schoolYearId: string) {
    return this.db.class.count({
      where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
    });
  }

  async countUnlockedClasses(orgId: string, schoolYearId: string) {
    return this.db.gradeLock.count({
      where: {
        org_id: orgId,
        is_locked: false,
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
    });
  }

  async countPendingStudents(orgId: string, schoolYearId: string) {
    return this.db.studentSchoolYear.count({
      where: { org_id: orgId, school_year_id: schoolYearId, status: 'pending' },
    });
  }

  async getEducatorLoad(orgId: string, schoolYearId: string) {
    // Perf Phase 4: server-side counts (groupBy) instead of hydrating every
    // enrollment row into Node. Same output shape as before.
    const classWhere = {
      org_id: orgId,
      school_year_id: schoolYearId,
      deleted_at: null,
    };

    const [classes, enrollmentCounts] = await Promise.all([
      this.db.class.findMany({
        where: classWhere,
        select: { id: true, educator_id: true },
      }),
      this.db.enrollment.groupBy({
        by: ['class_id'],
        where: {
          org_id: orgId,
          class: { school_year_id: schoolYearId, deleted_at: null },
        },
        _count: { _all: true },
      }),
    ]);

    const studentsByClass = new Map(
      enrollmentCounts.map((row) => [row.class_id, row._count._all]),
    );

    const map: Record<string, { totalClasses: number; totalStudents: number }> =
      {};
    for (const cls of classes) {
      if (!map[cls.educator_id]) {
        map[cls.educator_id] = { totalClasses: 0, totalStudents: 0 };
      }
      map[cls.educator_id].totalClasses += 1;
      map[cls.educator_id].totalStudents +=
        studentsByClass.get(cls.id) ?? 0;
    }

    return Object.entries(map).map(([educatorId, data]) => ({
      educatorId,
      ...data,
    }));
  }

  private lockedGradeWhere(
    orgId: string,
    schoolYearId: string,
    query: GradeAnalyticsQueryDto,
  ) {
    return {
      org_id: orgId,
      is_locked: true,
      class: { school_year_id: schoolYearId, deleted_at: null },
      ...(query.classId && { class_id: query.classId }),
      ...(query.termId && { term_id: query.termId }),
    };
  }

  /**
   * Perf Phase 4: grade stats computed in SQL (groupBy + aggregates) instead
   * of transferring every locked-grade row into Node for JS reduce.
   */
  async getGradeStats(
    orgId: string,
    schoolYearId: string,
    query: GradeAnalyticsQueryDto,
  ) {
    const where = this.lockedGradeWhere(orgId, schoolYearId, query);
    const [groups, totals, passing] = await Promise.all([
      this.db.grade.groupBy({
        by: ['final_grade'],
        where,
        _count: { _all: true },
      }),
      this.db.grade.aggregate({
        where,
        _count: { _all: true },
        _avg: { final_score: true },
      }),
      this.db.grade.aggregate({
        where: { ...where, final_score: { gte: 75 } },
        _count: { _all: true },
      }),
    ]);

    const distribution: Record<string, number> = {};
    for (const group of groups) {
      distribution[group.final_grade] = group._count._all;
    }

    return {
      total: totals._count._all,
      averageScore: totals._avg.final_score,
      passCount: passing._count._all,
      distribution,
    };
  }

  async getEnrollmentBreakdown(
    orgId: string,
    schoolYearId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [sections, total] = await Promise.all([
      this.db.section.findMany({
        where: {
          org_id: orgId,
          school_year_id: schoolYearId,
          deleted_at: null,
        },
        include: { level: { include: { program: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.db.section.count({
        where: {
          org_id: orgId,
          school_year_id: schoolYearId,
          deleted_at: null,
        },
      }),
    ]);

    const pageSectionIds = sections.map((s) => s.id);

    const classes =
      pageSectionIds.length > 0
        ? await this.db.class.findMany({
            where: {
              org_id: orgId,
              school_year_id: schoolYearId,
              deleted_at: null,
              section_id: { in: pageSectionIds },
            },
            select: {
              section_id: true,
              enrollments: { select: { status: true } },
            },
          })
        : [];

    const sectionEnrollments = new Map<
      string,
      { active: number; pending: number }
    >();
    for (const cls of classes) {
      if (!cls.section_id) continue;
      if (!sectionEnrollments.has(cls.section_id)) {
        sectionEnrollments.set(cls.section_id, { active: 0, pending: 0 });
      }
      const entry = sectionEnrollments.get(cls.section_id)!;
      for (const e of cls.enrollments) {
        if (e.status === 'active') entry.active += 1;
        if (e.status === 'pending') entry.pending += 1;
      }
    }

    const data = sections.map((section) => {
      const counts = sectionEnrollments.get(section.id) ?? {
        active: 0,
        pending: 0,
      };
      return {
        levelSection: `${section.level.name} - ${section.name}`,
        programName: section.level.program.name,
        gradeLevel: section.level.name,
        sectionName: section.name,
        activeCount: counts.active,
        pendingCount: counts.pending,
        totalCount: counts.active + counts.pending,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

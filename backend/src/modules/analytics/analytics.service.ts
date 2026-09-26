import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { GradeAnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  private async resolveSchoolYear(
    orgId: string,
    schoolYearId?: string,
  ): Promise<string> {
    if (schoolYearId) return schoolYearId;
    const active = await this.repo.getActiveSchoolYear(orgId);
    if (!active) throw new NotFoundException('No active school year found.');
    return active.id;
  }

  async getOverview(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);

    const [totalStudents, pendingStudents, totalEducators, totalClasses] =
      await Promise.all([
        this.repo.countStudents(orgId, syId),
        this.repo.countPendingStudents(orgId, syId),
        this.repo.countEducators(orgId),
        this.repo.countClasses(orgId, syId),
      ]);

    return {
      totalStudents,
      pendingStudents,
      totalEducators,
      totalClasses,
      schoolYearId: syId,
    };
  }

  async getEnrollmentBreakdown(
    orgId: string,
    schoolYearId?: string,
    page = 1,
    limit = 20,
  ) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    return this.repo.getEnrollmentBreakdown(orgId, syId, page, limit);
  }

  async getGradeAnalytics(
    orgId: string,
    query: GradeAnalyticsQueryDto,
    schoolYearId?: string,
  ) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    // Perf Phase 4: stats come from SQL groupBy/aggregate (no row transfer).
    const stats = await this.repo.getGradeStats(orgId, syId, query);

    if (!stats.total) return { passingRate: 0, distribution: {} };

    return {
      passingRate: stats.passCount / stats.total,
      distribution: stats.distribution,
    };
  }

  async getEducatorLoad(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    return this.repo.getEducatorLoad(orgId, syId);
  }

  async getAlerts(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    const [pendingStudents, unlockedClasses] = await Promise.all([
      this.repo.countPendingStudents(orgId, syId),
      this.repo.countUnlockedClasses(orgId, syId),
    ]);
    return { pendingStudents, unlockedClasses };
  }
}

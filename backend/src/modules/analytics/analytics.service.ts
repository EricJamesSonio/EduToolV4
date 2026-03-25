// src/modules/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { GradeAnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
  ) {}

  // ── OVERVIEW ───────────────────────────────────────────────

  async getOverview(orgId: string) {
    const [
      totalStudents,
      activeStudents,
      pendingStudents,
      totalEducators,
      totalClasses,
    ] = await Promise.all([
      this.repo.countStudents(orgId),
      this.repo.countStudentsByStatus(orgId, 'active'),
      this.repo.countStudentsByStatus(orgId, 'pending'),
      this.repo.countEducators(orgId),
      this.repo.countClasses(orgId),
    ]);

    return {
      totalStudents,
      activeStudents,
      pendingStudents,
      totalEducators,
      totalClasses,
    };
  }

  // ── ENROLLMENT ─────────────────────────────────────────────

  async getEnrollmentBreakdown(orgId: string) {
    const byStatus = await this.repo.groupStudentsByStatus(orgId);

    return {
      byStatus,
    };
  }

  // ── GRADES (LOCKED ONLY) ───────────────────────────────────

  async getGradeAnalytics(
    orgId: string,
    query: GradeAnalyticsQueryDto,
  ) {
    const grades = await this.repo.getLockedGrades(orgId, query);

    if (!grades.length) {
      return {
        passingRate: 0,
        distribution: {},
      };
    }

    let passCount = 0;
    const distribution: Record<string, number> = {};

    for (const g of grades) {
      // count passing
      if (g.final_score >= 75) passCount++;

      // distribution
      const key = g.final_grade;
      distribution[key] = (distribution[key] || 0) + 1;
    }

    return {
      passingRate: passCount / grades.length,
      distribution,
    };
  }

  // ── EDUCATOR LOAD ──────────────────────────────────────────

  async getEducatorLoad(orgId: string) {
    return this.repo.getEducatorLoad(orgId);
  }

  // ── ALERTS ─────────────────────────────────────────────────

  async getAlerts(orgId: string) {
    const [
      pendingStudents,
      unlockedClasses,
    ] = await Promise.all([
      this.repo.countStudentsByStatus(orgId, 'pending'),
      this.repo.countUnlockedClasses(orgId),
    ]);

    return {
      pendingStudents,
      unlockedClasses,
    };
  }
}
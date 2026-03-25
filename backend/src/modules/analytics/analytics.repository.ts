// src/modules/analytics/analytics.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';
import { GradeAnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── STUDENTS ───────────────────────────────────────────────

  async countStudents(orgId: string) {
    return this.db.account.count({
      where: { org_id: orgId, role: 'student' },
    });
  }

  async countStudentsByStatus(orgId: string, status: any) {
    return this.db.account.count({
      where: {
        org_id: orgId,
        role: 'student',
        status,
      },
    });
  }

  async groupStudentsByStatus(orgId: string) {
    const result = await this.db.account.groupBy({
      by: ['status'],
      where: {
        org_id: orgId,
        role: 'student',
      },
      _count: true,
    });

    const formatted: Record<string, number> = {};

    result.forEach(r => {
      formatted[r.status] = r._count;
    });

    return formatted;
  }

  // ── EDUCATORS ──────────────────────────────────────────────

  async countEducators(orgId: string) {
    return this.db.account.count({
      where: { org_id: orgId, role: 'educator' },
    });
  }

  async getEducatorLoad(orgId: string) {
    const classes = await this.db.class.findMany({
      where: { org_id: orgId },
      select: {
        educator_id: true,
        enrollments: {
          select: { id: true },
        },
      },
    });

    const map: Record<
      string,
      { totalClasses: number; totalStudents: number }
    > = {};

    for (const cls of classes) {
      if (!map[cls.educator_id]) {
        map[cls.educator_id] = {
          totalClasses: 0,
          totalStudents: 0,
        };
      }

      map[cls.educator_id].totalClasses += 1;
      map[cls.educator_id].totalStudents += cls.enrollments.length;
    }

    return Object.entries(map).map(([educatorId, data]) => ({
      educatorId,
      ...data,
    }));
  }

  // ── CLASSES ────────────────────────────────────────────────

  async countClasses(orgId: string) {
    return this.db.class.count({
      where: { org_id: orgId },
    });
  }

  async countUnlockedClasses(orgId: string) {
    return this.db.gradeLock.count({
      where: {
        org_id: orgId,
        is_locked: false,
      },
    });
  }

  // ── GRADES ─────────────────────────────────────────────────

  async getLockedGrades(
    orgId: string,
    query: GradeAnalyticsQueryDto,
  ) {
    return this.db.grade.findMany({
      where: {
        org_id: orgId,
        is_locked: true,

        ...(query.classId && { class_id: query.classId }),
        ...(query.termId && { term_id: query.termId }),
      },
      select: {
        final_score: true,
        final_grade: true,
      },
    });
  }
}
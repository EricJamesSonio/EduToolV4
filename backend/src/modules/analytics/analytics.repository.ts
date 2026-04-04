// @/modules/analytics/analytics.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
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


  async getEnrollmentBreakdown(orgId: string) {
    const sections = await this.db.section.findMany({
      where: { org_id: orgId, deleted_at: null },
    });

    const levels = await this.db.level.findMany({
      where: { org_id: orgId },
    });

    const programs = await this.db.program.findMany({
      where: { org_id: orgId },
    });

    // Count enrollments per section via Class → Enrollment
    const classes = await this.db.class.findMany({
      where: { org_id: orgId, deleted_at: null },
      select: {
        section_id: true,
        enrollments: {
          select: { status: true },
        },
      },
    });

    // Build lookup maps
    const levelMap = new Map(levels.map((l) => [l.id, l]));
    const programMap = new Map(programs.map((p) => [p.id, p]));

    // ✅ FIXED: proper Map generic syntax
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

    return sections.map((section) => {
      const level = levelMap.get(section.level_id);
      const program = level ? programMap.get(level.program_id) : null;

      const counts = sectionEnrollments.get(section.id) ?? {
        active: 0,
        pending: 0,
      };

      return {
        levelSection: `${level?.name ?? '—'} - ${section.name}`,
        programName: program?.name ?? '—',
        gradeLevel: level?.name ?? '—',
        sectionName: section.name,
        activeCount: counts.active,
        pendingCount: counts.pending,
        totalCount: counts.active + counts.pending,
      };
    });
  }
}
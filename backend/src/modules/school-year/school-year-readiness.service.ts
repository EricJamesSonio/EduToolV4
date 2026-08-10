// backend/src/modules/school-year/school-year-readiness.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export type ReadinessSeverity = 'blocking' | 'warning';

export interface ReadinessIssue {
  code: string;
  severity: ReadinessSeverity;
  message: string;
  ref?: { type: 'program' | 'course' | 'strand' | 'level' | 'subject'; id: string; name: string };
}

export interface ReadinessResult {
  ready: boolean;
  blockingCount: number;
  warningCount: number;
  issues: ReadinessIssue[];
}

export interface ReadinessSummary {
  schoolYearId: string;
  ready: boolean;
  blockingCount: number;
  warningCount: number;
}

/** Per code, the maximum number of issue entries included in a detail result. */
const MAX_ISSUES_PER_CODE = 20;

@Injectable()
export class SchoolYearReadinessService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Full readiness detail for a single school year.
   * Throws 404 when the school year does not exist in the org.
   */
  async detail(
    orgId: string,
    schoolYearId: string,
    options: { includeWarnings?: boolean } = {},
  ): Promise<ReadinessResult> {
    const { includeWarnings = true } = options;

    const schoolYear = await this.db.schoolYear.findFirst({
      where: { id: schoolYearId, org_id: orgId },
      select: {
        id: true,
        name: true,
        start_date: true,
        status: true,
      },
    });

    if (!schoolYear) {
      throw new NotFoundException('School year not found.');
    }

    const issues: ReadinessIssue[] = [];

    if (!schoolYear.start_date) {
      issues.push({
        code: 'missing_start_date',
        severity: 'blocking',
        message: `School year "${schoolYear.name}" has no start date and cannot be used.`,
      });
    }

    const programs = await this.db.program.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        _count: { select: { levels: true, courses: true, strands: true } },
      },
    });

    if (programs.length === 0) {
      issues.push({
        code: 'no_programs',
        severity: 'blocking',
        message: `School year "${schoolYear.name}" has no programs.`,
      });
    }

    for (const program of programs) {
      this.push(issues, {
        code: 'program_no_levels',
        severity: 'blocking',
        ref: { type: 'program', id: program.id, name: program.name },
        message: `Program "${program.name}" has no levels.`,
        when: program._count.levels === 0,
      });

      if (program.type === 'college') {
        const courses = await this.db.course.findMany({
          where: { program_id: program.id, org_id: orgId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, _count: { select: { levels: true } } },
        });
        for (const course of courses) {
          this.push(issues, {
            code: 'course_no_level',
            severity: 'blocking',
            ref: { type: 'course', id: course.id, name: course.name },
            message: `Course "${course.name}" has no levels.`,
            when: course._count.levels === 0,
          });
        }
      } else if (program.type === 'senior_high') {
        const strands = await this.db.strand.findMany({
          where: { program_id: program.id, org_id: orgId },
          orderBy: { name: 'asc' },
          select: { id: true, name: true, _count: { select: { levels: true } } },
        });
        for (const strand of strands) {
          this.push(issues, {
            code: 'strand_no_level',
            severity: 'blocking',
            ref: { type: 'strand', id: strand.id, name: strand.name },
            message: `Strand "${strand.name}" has no levels.`,
            when: strand._count.levels === 0,
          });
        }
      }
    }

    const levels = await this.db.level.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            sections: { where: { deleted_at: null } },
            subjects: true,
          },
        },
      },
    });

    for (const level of levels) {
      this.push(issues, {
        code: 'level_no_sections',
        severity: 'blocking',
        ref: { type: 'level', id: level.id, name: level.name },
        message: `Level "${level.name}" has no sections.`,
        when: level._count.sections === 0,
      });

      this.push(issues, {
        code: 'level_no_subjects',
        severity: 'blocking',
        ref: { type: 'level', id: level.id, name: level.name },
        message: `Level "${level.name}" has no subjects.`,
        when: level._count.subjects === 0,
      });
    }

    if (includeWarnings) {
      const levelIds = levels.map((l) => l.id);
      const subjects = await this.db.subject.findMany({
        where: { org_id: orgId, level_id: { in: levelIds } },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          _count: { select: { classes: { where: { deleted_at: null } } } },
        },
      });

      for (const subject of subjects) {
        this.push(issues, {
          code: 'subject_no_class',
          severity: 'warning',
          ref: { type: 'subject', id: subject.id, name: subject.name },
          message: `Subject "${subject.name}" has no classes created.`,
          when: subject._count.classes === 0,
        });
      }
    }

    return this.buildResult(issues);
  }

  /**
   * Lightweight per-year summary for the org-wide list page.
   * Exactly one school year per org entry is analyzed in a small constant number
   * of grouped queries (no unbounded sub-iteration).
   */
  async summarizeAll(orgId: string): Promise<Record<string, ReadinessSummary>> {
    const schoolYears = await this.db.schoolYear.findMany({
      where: { org_id: orgId },
      select: { id: true, name: true, start_date: true },
    });

    const programCounts = await this.db.program.groupBy({
      by: ['school_year_id'],
      where: { org_id: orgId },
      _count: { _all: true },
    });
    const levelCounts = await this.db.level.groupBy({
      by: ['school_year_id'],
      where: { org_id: orgId },
      _count: { _all: true },
    });
    const sectionCounts = await this.db.section.groupBy({
      by: ['school_year_id'],
      where: { org_id: orgId, deleted_at: null },
      _count: { _all: true },
    });

    const programByYear = this.toMap(programCounts, 'school_year_id');
    const levelByYear = this.toMap(levelCounts, 'school_year_id');
    const sectionByYear = this.toMap(sectionCounts, 'school_year_id');

    const summaries: Record<string, ReadinessSummary> = {};
    for (const sy of schoolYears) {
      const blockingCount = this.summaryBlockingCount(sy, programByYear, levelByYear, sectionByYear);
      summaries[sy.id] = {
        schoolYearId: sy.id,
        ready: blockingCount === 0,
        blockingCount,
        warningCount: 0,
      };
    }

    return summaries;
  }

  /**
   * Convenience guard used by other services: resolves readiness WITHOUT throwing
   * on the school year's absence — returns a ready=false result instead.
   */
  async assertReady(orgId: string, schoolYearId: string): Promise<void> {
    let result: ReadinessResult;
    try {
      result = await this.detail(orgId, schoolYearId, { includeWarnings: false });
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new BadRequestException('School year not found.');
      }
      throw err;
    }

    if (!result.ready) {
      const messages = result.issues
        .filter((i) => i.severity === 'blocking')
        .slice(0, MAX_ISSUES_PER_CODE)
        .map((i) => i.message);
      throw new BadRequestException({
        statusCode: 400,
        error: 'SCHOOL_YEAR_NOT_READY',
        message: `School year is not ready to be used: ${messages.join(' ')}`,
        issues: result.issues,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildResult(issues: ReadinessIssue[]): ReadinessResult {
    const blockingCount = issues.filter((i) => i.severity === 'blocking').length;
    return {
      ready: blockingCount === 0,
      blockingCount,
      warningCount: issues.length - blockingCount,
      issues,
    };
  }

  private push(
    issues: ReadinessIssue[],
    candidate: ReadinessIssue & { when: boolean },
  ): void {
    if (!candidate.when) return;
    const { when, ...issue } = candidate;
    const count = issues.filter((i) => i.code === issue.code).length;
    if (count >= MAX_ISSUES_PER_CODE) return;
    issues.push(issue);
  }

  private toMap(rows: Array<Record<string, any>>, key: string): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of rows) {
      const count = row._count?._all ?? row._count;
      map.set(row[key], Number(count));
    }
    return map;
  }

  /** Fast approximate blocking count for the summary view. */
  private summaryBlockingCount(
    sy: { id: string; start_date: Date | null },
    programByYear: Map<string, number>,
    levelByYear: Map<string, number>,
    sectionByYear: Map<string, number>,
  ): number {
    let count = 0;
    if (!sy.start_date) count += 1;
    if ((programByYear.get(sy.id) ?? 0) === 0) count += 1;
    if ((levelByYear.get(sy.id) ?? 0) === 0) count += 1;
    if ((sectionByYear.get(sy.id) ?? 0) === 0) count += 1;
    return count;
  }
}
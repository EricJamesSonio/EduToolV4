// backend/src/modules/school-year/school-year-readiness.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export type ReadinessSeverity = 'blocking' | 'warning';

export interface ReadinessIssue {
  code: string;
  severity: ReadinessSeverity;
  message: string;
  /** How many entities are affected by this issue (absent on legacy per-entity issues). */
  count?: number;
  /** Optional detail list of affected entities, capped (see pushList). */
  entities?: { id: string; name: string }[];
  ref?: {
    type: 'program' | 'course' | 'strand' | 'level' | 'subject';
    id: string;
    name: string;
  };
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
  async detail(orgId: string, schoolYearId: string): Promise<ReadinessResult> {
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
          select: {
            id: true,
            name: true,
            _count: { select: { levels: true } },
          },
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
          select: {
            id: true,
            name: true,
            _count: { select: { levels: true } },
          },
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

    // ----------------------------------------------------------------------
    // Overview's hard-block checklist (all blocking, no override).
    // Empty-school-year rule: a year with zero programs already fails via
    // `no_programs` above, so a year with nothing configured is NOT ready —
    // this is deliberate, not an oversight.
    // ----------------------------------------------------------------------

    const levelIds = levels.map((l) => l.id);
    const programIds = programs.map((p) => p.id);
    const courses = await this.db.course.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      select: { id: true, name: true },
    });
    const strands = await this.db.strand.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      select: { id: true, name: true },
    });
    const courseIds = courses.map((c) => c.id);
    const strandIds = strands.map((s) => s.id);

    // 1. Every subject scoped to this school year (via level/program/course/strand)
    //    has at least one Class.
    const subjects = await this.db.subject.findMany({
      where: {
        org_id: orgId,
        OR: [
          { level_id: { in: levelIds } },
          { program_id: { in: programIds } },
          { course_id: { in: courseIds } },
          { strand_id: { in: strandIds } },
        ],
      },
      select: {
        id: true,
        name: true,
        _count: { select: { classes: { where: { deleted_at: null } } } },
      },
    });
    this.pushList(issues, {
      code: 'subject_no_class',
      items: subjects
        .filter((s) => s._count.classes === 0)
        .map((s) => ({ id: s.id, name: s.name })),
      message: (count) =>
        `${count} subject(s) in this school year have no class created.`,
    });

    // 2. Every Section (school_year_id = this year) has at least one Class.
    //    Section has no Class relation in the schema, so use a count comparison.
    const sectionClassCounts = await this.db.class.groupBy({
      by: ['section_id'],
      where: { org_id: orgId, deleted_at: null },
      _count: { _all: true },
    });
    const sectionsWithClasses = new Set<string>(
      sectionClassCounts
        .filter((r) => r.section_id !== null)
        .map((r) => r.section_id as string),
    );
    const sections = await this.db.section.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId, deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    this.pushList(issues, {
      code: 'section_no_class',
      items: sections.filter((s) => !sectionsWithClasses.has(s.id)),
      message: (count) =>
        `${count} section(s) in this school year have no class created.`,
    });

    // 3. Every Program in this school year has a ProgramCalendar.
    const programsWithoutCalendar = await this.db.program.findMany({
      where: {
        school_year_id: schoolYearId,
        org_id: orgId,
        programCalendars: { none: {} },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    this.pushList(issues, {
      code: 'program_no_calendar',
      items: programsWithoutCalendar,
      message: (count) =>
        `${count} program(s) have no academic calendar set up.`,
    });

    // 5. Every Program in this school year has a GradingScaleAssignment.
    const programsWithoutScale = await this.db.program.findMany({
      where: {
        school_year_id: schoolYearId,
        org_id: orgId,
        gradingScaleAssignments: { none: {} },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    this.pushList(issues, {
      code: 'program_no_grading_scale',
      items: programsWithoutScale,
      message: (count) => `${count} program(s) have no grading scale assigned.`,
    });

    // 4. Every Program has a ProgramSemesterAssignment, AND every term in that
    //    assignment's template has a ProgramSemesterTermDate with dates filled.
    //    (ProgramSemesterTermDate.start_date/end_date are non-null, so "has a
    //    date, filled" reduces to "has a term-date row for every template term".)
    const programSem = await this.db.program.findMany({
      where: { school_year_id: schoolYearId, org_id: orgId },
      select: {
        id: true,
        name: true,
        semesterAssignment: {
          select: {
            id: true,
            template: {
              select: {
                semesters: { select: { terms: { select: { id: true } } } },
              },
            },
          },
        },
      },
    });
    const termDateCounts = await this.db.programSemesterTermDate.groupBy({
      by: ['assignment_id'],
      where: { org_id: orgId },
      _count: { _all: true },
    });
    const termDateByAssignment = new Map<number | string, number>();
    for (const row of termDateCounts)
      termDateByAssignment.set(row.assignment_id, row._count._all);
    const noAssignment: { id: string; name: string }[] = [];
    const incompleteDates: { id: string; name: string }[] = [];
    for (const prog of programSem) {
      const assignment = prog.semesterAssignment;
      if (!assignment) {
        noAssignment.push({ id: prog.id, name: prog.name });
        continue;
      }
      const requiredTerms = assignment.template.semesters.reduce(
        (sum, sem) => sum + sem.terms.length,
        0,
      );
      const presentDates = termDateByAssignment.get(assignment.id) ?? 0;
      if (presentDates < requiredTerms) {
        incompleteDates.push({ id: prog.id, name: prog.name });
      }
    }
    this.pushList(issues, {
      code: 'program_no_semester_assignment',
      items: noAssignment,
      message: (count) =>
        `${count} program(s) have no semester template assigned.`,
    });
    this.pushList(issues, {
      code: 'program_semester_dates_incomplete',
      items: incompleteDates,
      message: (count) =>
        `${count} program(s) have incomplete semester term dates.`,
    });

    // 6. Every Class in this school year has at least one GradingScheme.
    const classesWithoutScheme = await this.db.class.findMany({
      where: {
        school_year_id: schoolYearId,
        org_id: orgId,
        deleted_at: null,
        gradingSchemes: { none: {} },
      },
      select: { id: true, subject: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
    });
    this.pushList(issues, {
      code: 'class_no_grading_scheme',
      items: classesWithoutScheme.map((c) => ({
        id: c.id,
        name: c.subject?.name ?? c.id,
      })),
      message: (count) => `${count} class(es) have no grading scheme.`,
    });

    // 7. Educator assignment is structurally guaranteed by the non-nullable
    //    Class.educator_id column, so no runtime check is required.

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
      const blockingCount = this.summaryBlockingCount(
        sy,
        programByYear,
        levelByYear,
        sectionByYear,
      );
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
      result = await this.detail(orgId, schoolYearId);
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
    const blockingCount = issues.filter(
      (i) => i.severity === 'blocking',
    ).length;
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
    const { when: _when, ...issue } = candidate;
    const count = issues.filter((i) => i.code === issue.code).length;
    if (count >= MAX_ISSUES_PER_CODE) return;
    issues.push(issue);
  }

  /**
   * Pushes a single aggregated blocking issue from a list of affected entities,
   * carrying the total `count` and a capped `entities` detail list.
   */
  private pushList(
    issues: ReadinessIssue[],
    args: {
      code: string;
      message: (count: number) => string;
      items: { id: string; name: string }[];
    },
    cap = 10,
  ): void {
    if (args.items.length === 0) return;
    issues.push({
      code: args.code,
      severity: 'blocking',
      message: args.message(args.items.length),
      count: args.items.length,
      entities: args.items.slice(0, cap),
    });
  }

  private toMap(
    rows: Array<Record<string, any>>,
    key: string,
  ): Map<string, number> {
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

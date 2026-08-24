/**
 * readiness-check.ts
 *
 * Re-implements the exact blocking checks from
 * SchoolYearReadinessService.detail() directly against the DB (the seed
 * script runs outside Nest's DI container, so the real service can't be
 * injected here). Every query below mirrors that service 1:1 so the seed
 * can never mark a year "ready" that the real activation flow would
 * reject, or vice versa.
 */

import { db } from './db';

export interface ReadinessCheckResult {
  ready: boolean;
  issues: string[];
}

export async function checkSchoolYearReadiness(
  orgId: string,
  schoolYearId: string,
): Promise<ReadinessCheckResult> {
  const issues: string[] = [];

  const schoolYear = await db.schoolYear.findFirst({
    where: { id: schoolYearId, org_id: orgId },
    select: { id: true, name: true, start_date: true },
  });
  if (!schoolYear) {
    return { ready: false, issues: ['School year not found.'] };
  }
  if (!schoolYear.start_date) {
    issues.push(`School year "${schoolYear.name}" has no start date.`);
  }

  const programs = await db.program.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: {
      id: true,
      name: true,
      type: true,
      _count: { select: { levels: true, courses: true, strands: true } },
    },
  });
  if (programs.length === 0) {
    issues.push(`School year "${schoolYear.name}" has no programs.`);
  }

  for (const program of programs) {
    if (program._count.levels === 0) {
      issues.push(`Program "${program.name}" has no levels.`);
    }

    if (program.type === 'college') {
      const courses = await db.course.findMany({
        where: { program_id: program.id, org_id: orgId },
        select: { id: true, name: true, _count: { select: { levels: true } } },
      });
      for (const course of courses) {
        if (course._count.levels === 0) {
          issues.push(`Course "${course.name}" has no levels.`);
        }
      }
    } else if (program.type === 'senior_high') {
      const strands = await db.strand.findMany({
        where: { program_id: program.id, org_id: orgId },
        select: { id: true, name: true, _count: { select: { levels: true } } },
      });
      for (const strand of strands) {
        if (strand._count.levels === 0) {
          issues.push(`Strand "${strand.name}" has no levels.`);
        }
      }
    }
  }

  const levels = await db.level.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
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
    if (level._count.sections === 0) {
      issues.push(`Level "${level.name}" has no sections.`);
    }
    if (level._count.subjects === 0) {
      issues.push(`Level "${level.name}" has no subjects.`);
    }
  }

  const levelIds = levels.map((l) => l.id);
  const programIds = programs.map((p) => p.id);
  const courses = await db.course.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: { id: true },
  });
  const strands = await db.strand.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId },
    select: { id: true },
  });
  const courseIds = courses.map((c) => c.id);
  const strandIds = strands.map((s) => s.id);

  const subjects = await db.subject.findMany({
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
  const subjectsNoClass = subjects.filter((s) => s._count.classes === 0);
  if (subjectsNoClass.length > 0) {
    issues.push(`${subjectsNoClass.length} subject(s) have no class created.`);
  }

  const sectionClassCounts = await db.class.groupBy({
    by: ['section_id'],
    where: { org_id: orgId, deleted_at: null },
    _count: { _all: true },
  });
  const sectionsWithClasses = new Set<string>(
    sectionClassCounts
      .filter((r) => r.section_id !== null)
      .map((r) => r.section_id as string),
  );
  const sections = await db.section.findMany({
    where: { school_year_id: schoolYearId, org_id: orgId, deleted_at: null },
    select: { id: true, name: true },
  });
  const sectionsNoClass = sections.filter(
    (s) => !sectionsWithClasses.has(s.id),
  );
  if (sectionsNoClass.length > 0) {
    issues.push(`${sectionsNoClass.length} section(s) have no class created.`);
  }

  const programsWithoutCalendar = await db.program.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      programCalendars: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (programsWithoutCalendar.length > 0) {
    issues.push(
      `${programsWithoutCalendar.length} program(s) have no academic calendar set up.`,
    );
  }

  const programsWithoutScale = await db.program.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      gradingScaleAssignments: { none: {} },
    },
    select: { id: true, name: true },
  });
  if (programsWithoutScale.length > 0) {
    issues.push(
      `${programsWithoutScale.length} program(s) have no grading scale assigned.`,
    );
  }

  const programSem = await db.program.findMany({
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
  const termDateCounts = await db.programSemesterTermDate.groupBy({
    by: ['assignment_id'],
    where: { org_id: orgId },
    _count: { _all: true },
  });
  const termDateByAssignment = new Map<string, number>();
  for (const row of termDateCounts) {
    termDateByAssignment.set(row.assignment_id, row._count._all);
  }

  let noAssignmentCount = 0;
  let incompleteDatesCount = 0;
  for (const prog of programSem) {
    const assignment = prog.semesterAssignment;
    if (!assignment) {
      noAssignmentCount++;
      continue;
    }
    const requiredTerms = assignment.template.semesters.reduce(
      (sum, sem) => sum + sem.terms.length,
      0,
    );
    const presentDates = termDateByAssignment.get(assignment.id) ?? 0;
    if (presentDates < requiredTerms) incompleteDatesCount++;
  }
  if (noAssignmentCount > 0) {
    issues.push(
      `${noAssignmentCount} program(s) have no semester template assigned.`,
    );
  }
  if (incompleteDatesCount > 0) {
    issues.push(
      `${incompleteDatesCount} program(s) have incomplete semester term dates.`,
    );
  }

  const classesWithoutScheme = await db.class.findMany({
    where: {
      school_year_id: schoolYearId,
      org_id: orgId,
      deleted_at: null,
      gradingSchemes: { none: {} },
    },
    select: { id: true },
  });
  if (classesWithoutScheme.length > 0) {
    issues.push(
      `${classesWithoutScheme.length} class(es) have no grading scheme.`,
    );
  }

  return { ready: issues.length === 0, issues };
}

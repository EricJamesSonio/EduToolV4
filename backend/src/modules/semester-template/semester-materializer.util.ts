import { DatabaseService } from '@/core/database/database.provider';

interface MaterializeArgs {
  orgId: string;
  programId: string;
  schoolYearId: string;
}

/**
 * Creates the Semester + Term rows implied by a program's semester-template
 * assignment and its saved term dates. Only creates what is missing; existing
 * semesters and terms are never overwritten. Returns how many semesters were
 * created.
 */
export async function materializeSemestersFromAssignment(
  db: DatabaseService,
  args: MaterializeArgs,
): Promise<number> {
  const { orgId, programId, schoolYearId } = args;

  const assignment = await db.programSemesterAssignment.findFirst({
    where: { program_id: programId, org_id: orgId },
    include: {
      template: {
        include: {
          semesters: {
            orderBy: { order_index: 'asc' },
            include: { terms: { orderBy: { order_index: 'asc' } } },
          },
        },
      },
      termDates: true,
    },
  });
  if (!assignment) return 0;

  const dateByTerm = new Map<string, { start: Date; end: Date }>(
    assignment.termDates.map((td) => [
      td.term_id,
      { start: td.start_date, end: td.end_date },
    ]),
  );

  let created = 0;

  for (const semItem of assignment.template.semesters) {
    const entries = semItem.terms
      .map((t) => dateByTerm.get(t.id))
      .filter((d): d is { start: Date; end: Date } => !!d);
    if (entries.length === 0) continue;

    const semStart = new Date(
      Math.min(...entries.map((d) => d.start.getTime())),
    );
    const semEnd = new Date(Math.max(...entries.map((d) => d.end.getTime())));

    const where = {
      org_id: orgId,
      school_year_id: schoolYearId,
      program_id: programId,
      template_semester_id: semItem.id,
    };

    let semester = await db.semester.findFirst({ where });

    if (!semester) {
      try {
        semester = await db.semester.create({
          data: {
            ...where,
            name: semItem.name,
            start_date: semStart,
            end_date: semEnd,
          },
        });
        created++;
      } catch (err: any) {
        // Another request created it first (unique constraint) — reuse it.
        if (err?.code !== 'P2002') throw err;
        semester = await db.semester.findFirst({ where });
        if (!semester) throw err;
      }
    }

    for (const termItem of semItem.terms) {
      const dates = dateByTerm.get(termItem.id);
      if (!dates) continue;

      const existingTerm = await db.term.findFirst({
        where: {
          org_id: orgId,
          semester_id: semester.id,
          name: termItem.name,
        },
        select: { id: true },
      });
      if (existingTerm) continue;

      await db.term.create({
        data: {
          org_id: orgId,
          semester_id: semester.id,
          name: termItem.name,
          order_index: termItem.order_index,
          start_date: dates.start,
          end_date: dates.end,
        },
      });
    }
  }

  return created;
}
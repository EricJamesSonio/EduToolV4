/**
 * calendar.seeder.ts
 *
 * Must run BEFORE semester.seeder.ts: readiness requires "calendar first,
 * then the matching semester template." The number of breaks is derived
 * directly from that program's own semester template (2 semesters -> 2
 * breaks, 3 -> 3), so the break count and semester count can never drift
 * apart.
 */

import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { SEMESTER_TEMPLATES } from '../../../modules/org-seeder/data/semester-templates.data';
import { SY_END, SY_START } from '../constants';

export function computeCalendarBreaks(
  start: Date,
  end: Date,
  breakCount: number,
): { label: string; start_date: Date; end_date: Date; order_index: number }[] {
  if (breakCount <= 0) return [];

  const totalMs = end.getTime() - start.getTime();
  const breakDurationMs = 7 * 24 * 60 * 60 * 1000; // 1 week per break
  const segments = breakCount + 1;

  const breaks: {
    label: string;
    start_date: Date;
    end_date: Date;
    order_index: number;
  }[] = [];

  for (let i = 1; i <= breakCount; i++) {
    const position = start.getTime() + (totalMs * i) / segments;
    const breakStart = new Date(position);
    let breakEnd = new Date(position + breakDurationMs);
    if (breakEnd.getTime() > end.getTime()) breakEnd = new Date(end.getTime());

    breaks.push({
      label: `Break ${i}`,
      start_date: breakStart,
      end_date: breakEnd,
      order_index: i,
    });
  }

  return breaks;
}

export async function seedProgramCalendars(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  for (const progKey of programKeys) {
    const programId = programMap[progKey];
    if (!programId) continue;

    // Matches the schema's real @@unique([program_id, school_year_id]),
    // so this check is robust regardless of id-generation scheme.
    const existing = await db.programCalendar.findFirst({
      where: {
        program_id: programId,
        school_year_id: schoolYearId,
        org_id: orgId,
      },
    });
    if (existing) continue;

    const tpl = SEMESTER_TEMPLATES.find((t) => t.programType === progKey);
    const breakCount = tpl?.semesters.length ?? 1;

    const calendar = await db.programCalendar.create({
      data: {
        id: seedId('program-calendar', progKey, schoolYearId, orgId),
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
        start_date: SY_START,
        end_date: SY_END,
        notes: `Auto-seeded calendar with ${breakCount} break(s), matching the ${breakCount}-semester template for this program.`,
      },
    });

    const breaks = computeCalendarBreaks(SY_START, SY_END, breakCount);
    if (breaks.length > 0) {
      await db.programCalendarBreak.createMany({
        data: breaks.map((b) => ({
          id: uuid(),
          org_id: orgId,
          calendar_id: calendar.id,
          label: b.label,
          start_date: b.start_date,
          end_date: b.end_date,
          order_index: b.order_index,
        })),
      });
    }
  }
}

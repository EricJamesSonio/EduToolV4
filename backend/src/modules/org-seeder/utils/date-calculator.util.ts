import type { SemesterTemplateDef } from '../data/semester-templates.data';
import {
  addDaysToCalendarDate,
  calendarDateOf,
  calendarDateToUtc,
} from '@/commons/utils/datetime.util';

export interface ComputedTermDate {
  termId: string;
  startDate: Date;
  endDate: Date;
}

export interface ComputedSemesterDate {
  name: string;
  startDate: Date;
  endDate: Date;
  terms: ComputedTermDate[];
}

/**
 * Divides a school year date range evenly across all terms in a template.
 * Terms get equal durations. Semesters inherit their min/max term dates.
 *
 * TICK-INFRA-017: pure day arithmetic. Stored Dates arrive in mixed
 * conventions (UTC midnight from new writes, 16:00Z Manila-midnight from
 * legacy rows), so both endpoints are normalized to their intended
 * calendar days first. Terms come out as contiguous UTC-midnight day
 * ranges — no …-1ms ends, identical on every server TZ.
 *
 * @param syStart     School year start date
 * @param syEnd       School year end date
 * @param template    Semester template definition (from SEMESTER_TEMPLATES)
 * @param termIds     Flat ordered list of DB term IDs, must match template
 *                    order: semester[0].terms, semester[1].terms, ...
 */
export function computeTermDates(
  syStart: Date,
  syEnd: Date,
  template: SemesterTemplateDef,
  termIds: string[],
): ComputedTermDate[] {
  const startDay = calendarDateOf(syStart);
  const endDay = calendarDateOf(syEnd);
  const totalTerms = template.semesters.reduce((n, s) => n + s.terms.length, 0);

  if (totalTerms === 0 || termIds.length !== totalTerms) return [];
  if (endDay < startDay) return [];

  const totalDays =
    Math.round(
      (calendarDateToUtc(endDay).getTime() -
        calendarDateToUtc(startDay).getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1;

  const baseDays = Math.max(1, Math.floor(totalDays / totalTerms));
  // Spread leftover days over the earliest terms so the last term still
  // ends exactly on the school year end day.
  let remainder = totalDays - baseDays * totalTerms;
  if (remainder < 0) remainder = 0;

  const results: ComputedTermDate[] = [];
  let cursor = startDay;

  termIds.forEach((termId, i) => {
    const days = baseDays + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    // Degenerate ranges (fewer days than terms) clamp onto the end day
    // rather than running past it.
    const termStart = cursor > endDay ? endDay : cursor;
    // Last term ends exactly on the school year end day to avoid gaps.
    const termEnd =
      i === totalTerms - 1 ? endDay : addDaysToCalendarDate(termStart, days - 1);

    results.push({
      termId,
      startDate: calendarDateToUtc(termStart),
      endDate: calendarDateToUtc(termEnd),
    });
    cursor = addDaysToCalendarDate(termEnd, 1);
  });

  return results;
}

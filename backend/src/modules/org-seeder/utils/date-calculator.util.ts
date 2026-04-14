import type { SemesterTemplateDef } from '../data/semester-templates.data'

export interface ComputedTermDate {
  termId:    string
  startDate: Date
  endDate:   Date
}

export interface ComputedSemesterDate {
  name:      string
  startDate: Date
  endDate:   Date
  terms:     ComputedTermDate[]
}

/**
 * Divides a school year date range evenly across all terms in a template.
 * Terms get equal durations. Semesters inherit their min/max term dates.
 *
 * @param syStart     School year start date
 * @param syEnd       School year end date
 * @param template    Semester template definition (from SEMESTER_TEMPLATES)
 * @param termIds     Flat ordered list of DB term IDs, must match template
 *                    order: semester[0].terms, semester[1].terms, ...
 */
export function computeTermDates(
  syStart:  Date,
  syEnd:    Date,
  template: SemesterTemplateDef,
  termIds:  string[],
): ComputedTermDate[] {
  const totalMs    = syEnd.getTime() - syStart.getTime()
  const totalTerms = template.semesters.reduce((n, s) => n + s.terms.length, 0)

  if (totalTerms === 0 || termIds.length !== totalTerms) return []

  const termDurationMs = Math.floor(totalMs / totalTerms)
  const results: ComputedTermDate[] = []

  termIds.forEach((termId, i) => {
    const startDate = new Date(syStart.getTime() + i * termDurationMs)
    // Last term ends exactly on syEnd to avoid rounding gaps
    const endDate   = i === totalTerms - 1
      ? syEnd
      : new Date(syStart.getTime() + (i + 1) * termDurationMs - 1)

    results.push({ termId, startDate, endDate })
  })

  return results
}
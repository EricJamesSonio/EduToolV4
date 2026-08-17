export type TermDef = {
  name:        string
  order_index: number
}

export type SemesterItemDef = {
  name:        string
  order_index: number
  terms:       TermDef[]
}

export type SemesterTemplateDef = {
  name:        string
  programType: string   // matches Program.type
  semesters:   SemesterItemDef[]
}

const GENERIC_TERMS: TermDef[] = [
  { name: 'Term 1', order_index: 0 },
  { name: 'Term 2', order_index: 1 },
  { name: 'Term 3', order_index: 2 },
]

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']

/**
 * Builds a generic semester template with `semesterCount` semesters, each
 * containing the same generic "Term 1/2/3" rows. The seed flow calls this with
 * the calendar's period count so the template always matches the Academic
 * Calendar (never a skipped auto-registration). Users rename later.
 */
export function buildGenericTemplate(
  name: string,
  programType: string,
  semesterCount: number,
): SemesterTemplateDef {
  return {
    name,
    programType,
    semesters: Array.from({ length: semesterCount }, (_, i) => ({
      name:       ORDINALS[i] ?? `${i + 1}th Semester`,
      order_index: i,
      terms:      GENERIC_TERMS.map((t) => ({ ...t })),
    })),
  }
}

export const SEMESTER_TEMPLATES: SemesterTemplateDef[] = [
  buildGenericTemplate('Daycare / Kinder Template', 'daycare', 2),
  buildGenericTemplate('Kinder Template', 'kinder', 2),
  buildGenericTemplate('Elementary Semester Template', 'elementary', 2),
  buildGenericTemplate('Junior High School Semester Template', 'jhs', 2),
  buildGenericTemplate('Senior High School Semester Template', 'shs', 2),
  buildGenericTemplate('College Semester Template', 'college', 2),
]

/** Maps a programType to its template def for quick lookup */
export const SEMESTER_TEMPLATE_BY_PROGRAM: Record<string, SemesterTemplateDef> =
  Object.fromEntries(SEMESTER_TEMPLATES.map((t) => [t.programType, t]))
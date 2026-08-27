export type SemesterTerm = {
  name: string
  order_index: number
}

export type SemesterItem = {
  name: string
  order_index: number
  terms: SemesterTerm[]
}

export type SemesterTemplate = {
  name: string
  programType: string
  semesters: SemesterItem[]
}

const GENERIC_TERMS: SemesterTerm[] = [
  { name: "Term 1", order_index: 0 },
  { name: "Term 2", order_index: 1 },
  { name: "Term 3", order_index: 2 },
]

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]

/**
 * Suffix applied when a calendar-derived semester count differs from the
 * regular 2-semester default. Templates are org-global and reused by name
 * across every school year, so structurally different templates (e.g. a
 * trimester calendar vs a regular one) must never collide under one shared
 * name — the suffix keeps them distinct.
 */
const SEMESTER_COUNT_LABELS: Record<number, string> = {
  1: " - Annual",
  2: "", // regular default — no suffix, matches existing seeded data
  3: " - Trisem",
  4: " - Quadmester",
  5: " - Quintmester",
  6: " - Sextmester",
}

export function getAdaptedTemplateName(baseName: string, semesterCount: number): string {
  const suffix = SEMESTER_COUNT_LABELS[semesterCount] ?? ` - ${semesterCount} Semesters`
  return `${baseName}${suffix}`
}

/**
 * Mirrors the backend builder. During seeding the template adapts to the
 * calendar's period count — N periods => N semesters, each with generic
 * "Term 1/2/3" rows. These constants describe that default shape (2 semesters).
 * When `termNames` is provided (from School Profile), those names replace the generic ones.
 */
export function buildGenericTemplate(
  name: string,
  programType: string,
  semesterCount: number,
  termNames?: string[],
): SemesterTemplate {
  const terms: SemesterTerm[] = termNames && termNames.length > 0
    ? termNames.map((n, idx) => ({ name: n, order_index: idx }))
    : GENERIC_TERMS.map((t) => ({ ...t }))
  return {
    name: getAdaptedTemplateName(name, semesterCount),
    programType,
    semesters: Array.from({ length: semesterCount }, (_, i) => ({
      name: ORDINALS[i] ?? `${i + 1}th Semester`,
      order_index: i,
      terms: terms.map((t) => ({ ...t })),
    })),
  }
}

export const SEMESTER_TEMPLATES: SemesterTemplate[] = [
  buildGenericTemplate("Daycare / Kinder Template", "daycare", 2),
  buildGenericTemplate("Kinder Template", "kinder", 2),
  buildGenericTemplate("Elementary Semester Template", "elementary", 2),
  buildGenericTemplate("Junior High School Semester Template", "jhs", 2),
  buildGenericTemplate("Senior High School Semester Template", "shs", 2),
  buildGenericTemplate("College Semester Template", "college", 2),
]

export const SEMESTER_TEMPLATE_BY_PROGRAM: Record<string, SemesterTemplate> = Object.fromEntries(
  SEMESTER_TEMPLATES.map((t) => [t.programType, t])
)
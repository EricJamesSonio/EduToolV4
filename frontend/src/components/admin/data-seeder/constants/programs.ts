export const PROGRAMS = [
  { key: "daycare",    label: "Daycare / Pre-School" },
  { key: "kinder",     label: "Kindergarten" },
  { key: "elementary", label: "Elementary School" },
  { key: "jhs",        label: "Junior High School" },
  { key: "shs",        label: "Senior High School" },
  { key: "college",    label: "College / University" },
]

export const COLLEGE_COURSES = [
  { code: "BSIT",      name: "BS Information Technology",      years: 4 },
  { code: "BSBA",      name: "BS Business Administration",     years: 4 },
  { code: "BSED",      name: "Bachelor of Secondary Education", years: 4 },
  { code: "BSA",       name: "BS Accountancy",                 years: 5 },
  { code: "BSCS",      name: "BS Computer Science",            years: 4 },
  { code: "BSHM",      name: "BS Hospitality Management",      years: 4 },
  { code: "BSCRIM",    name: "BS Criminology",                 years: 4 },
  { code: "BSTM",      name: "BS Tourism Management",          years: 4 },
  { code: "BSED-ENG",  name: "BSED – English Major",           years: 4 },
  { code: "BSED-MATH", name: "BSED – Mathematics Major",       years: 4 },
  { code: "BSED-SCI",  name: "BSED – Science Major",            years: 4 },
  { code: "BSED-SS",   name: "BSED – Social Studies Major",    years: 4 },
  { code: "BSED-FIL",  name: "BSED – Filipino Major",          years: 4 },
  { code: "BSED-TLE",  name: "BSED – TLE Major",               years: 4 },
]

export const SHS_STRANDS = [
  "ABM", "STEM", "HUMSS", "GAS", "ICT", "HE", "IA", "Agri-Fishery", "Sports", "Arts and Design",
]

export const LEVEL_DEFS: Record<string, string[]> = {
  daycare:    ["Daycare 1", "Daycare 2"],
  kinder:     ["Kinder 1", "Kinder 2"],
  elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
  jhs:        ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
  shs:        ["Grade 11", "Grade 12"],
  college:    ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
}

export const LEVEL_MAX: Record<string, number> = {
  daycare:    5,
  kinder:     3,
  elementary: 12,
  jhs:        6,
  shs:        4,
  college:    5,
}

export const LEVEL_MIN: Record<string, number> = {
  daycare:    1,
  kinder:     1,
  elementary: 1,
  jhs:        1,
  shs:        1,
  college:    1,
}

export const COLLEGE_YEAR_LABELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]

export function generateLevelNames(prog: string, count: number): string[] {
  switch (prog) {
    case "daycare":    return Array.from({ length: count }, (_, i) => `Daycare ${i + 1}`)
    case "kinder":     return Array.from({ length: count }, (_, i) => `Kinder ${i + 1}`)
    case "elementary": return Array.from({ length: count }, (_, i) => `Grade ${i + 1}`)
    case "jhs":        return Array.from({ length: count }, (_, i) => `Grade ${i + 7}`)
    case "shs":        return Array.from({ length: count }, (_, i) => `Grade ${i + 11}`)
    case "college":    return Array.from({ length: count }, (_, i) => COLLEGE_YEAR_LABELS[i] ?? `Year ${i + 1}`)
    default:           return Array.from({ length: count }, (_, i) => `Level ${i + 1}`)
  }
}

export function getDefaultLevelNames(entityKey: string): string[] {
  if (LEVEL_DEFS[entityKey]) return [...LEVEL_DEFS[entityKey]]
  const course = COLLEGE_COURSES.find((c) => c.code === entityKey)
  if (course) return COLLEGE_YEAR_LABELS.slice(0, course.years)
  if (SHS_STRANDS.includes(entityKey)) return [...LEVEL_DEFS["shs"]]
  return generateLevelNames(entityKey, 4)
}

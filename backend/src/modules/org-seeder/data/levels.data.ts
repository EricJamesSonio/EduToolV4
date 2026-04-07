import { COLLEGE_COURSES, BSED_MAJORS } from './courses.data'
import { SHS_STRANDS } from './strands.data'

export type SectionDef = { name: string; capacity: number }
export type LevelDef   = { programKey: string; name: string; sections: SectionDef[] }

const s3x50 = (): SectionDef[] => [
  { name: 'Section A', capacity: 50 },
  { name: 'Section B', capacity: 50 },
  { name: 'Section C', capacity: 50 },
]
const s3x40 = (): SectionDef[] => [
  { name: 'Section A', capacity: 40 },
  { name: 'Section B', capacity: 40 },
  { name: 'Section C', capacity: 40 },
]
const s2x40 = (): SectionDef[] => [
  { name: 'Section A', capacity: 40 },
  { name: 'Section B', capacity: 40 },
]
const s2x30 = (): SectionDef[] => [
  { name: 'Section A', capacity: 30 },
  { name: 'Section B', capacity: 30 },
]

export const YEAR_LABELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']

export function buildLevelDefs(): LevelDef[] {
  const defs: LevelDef[] = []

  // Daycare & Kinder — unchanged
  defs.push(
    { programKey: 'daycare', name: 'Daycare 1', sections: s2x40() },
    { programKey: 'daycare', name: 'Daycare 2', sections: s2x40() },
    { programKey: 'kinder',  name: 'Kinder 1',  sections: s2x30() },
    { programKey: 'kinder',  name: 'Kinder 2',  sections: s2x30() },
  )

  // Elementary — Grade 1–6
  for (let g = 1; g <= 6; g++) {
    defs.push({ programKey: 'elementary', name: `Grade ${g}`, sections: s3x40() })
  }

  // JHS — Grade 7–10
  for (let g = 7; g <= 10; g++) {
    defs.push({ programKey: 'jhs', name: `Grade ${g}`, sections: s3x40() })
  }

  // SHS — shared levels: Grade 11 and Grade 12 (NOT per-strand)
  // Strands are separate entities; subjects map to level_id + strand_id
  defs.push(
    { programKey: 'shs', name: 'Grade 11', sections: s3x40() },
    { programKey: 'shs', name: 'Grade 12', sections: s3x40() },
  )

  // College — shared year levels across ALL courses (NOT per-course)
  // The max years across all courses is 5 (BSA), so we seed 1st–5th Year
  // Subjects map to level_id + course_id
  const maxYears = Math.max(...COLLEGE_COURSES.map((c) => c.years))
  for (let y = 1; y <= maxYears; y++) {
    defs.push({ programKey: 'college', name: YEAR_LABELS[y - 1], sections: s3x50() })
  }

  return defs
}
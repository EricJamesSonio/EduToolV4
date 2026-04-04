import { COLLEGE_COURSES, YEAR_LABELS } from './courses.data'
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

export function buildLevelDefs(): LevelDef[] {
  const defs: LevelDef[] = []

  defs.push(
    { programKey: 'daycare', name: 'Daycare 1', sections: s2x40() },
    { programKey: 'daycare', name: 'Daycare 2', sections: s2x40() },
    { programKey: 'kinder',  name: 'Kinder 1',  sections: s2x30() },
    { programKey: 'kinder',  name: 'Kinder 2',  sections: s2x30() },
  )

  for (let g = 1; g <= 6; g++) {
    defs.push({ programKey: 'elementary', name: `Grade ${g}`, sections: s3x40() })
  }
  for (let g = 7; g <= 10; g++) {
    defs.push({ programKey: 'jhs', name: `Grade ${g}`, sections: s3x40() })
  }
  for (const strand of SHS_STRANDS) {
    defs.push(
      { programKey: 'shs', name: `Grade 11 – ${strand}`, sections: s3x40() },
      { programKey: 'shs', name: `Grade 12 – ${strand}`, sections: s3x40() },
    )
  }
  for (const course of COLLEGE_COURSES) {
    for (let y = 1; y <= course.years; y++) {
      defs.push({
        programKey: 'college',
        name: `${course.code} – ${YEAR_LABELS[y - 1]}`,
        sections: s3x50(),
      })
    }
  }

  return defs
}
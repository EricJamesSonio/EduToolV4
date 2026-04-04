import { COLLEGE_COURSES, YEAR_LABELS } from './courses.data'
import { SHS_STRANDS } from './strands.data'

export const SCALE_K12 = [
  { min: 90, max: 100, label: 'Outstanding' },
  { min: 85, max: 89,  label: 'Very Satisfactory' },
  { min: 80, max: 84,  label: 'Satisfactory' },
  { min: 75, max: 79,  label: 'Fairly Satisfactory' },
  { min: 0,  max: 74,  label: 'Did Not Meet Expectations' },
]

export const SCALE_COLLEGE = [
  { min: 97, max: 100, label: '1.0 – Excellent' },
  { min: 93, max: 96,  label: '1.25 – Very Good' },
  { min: 89, max: 92,  label: '1.5 – Very Good' },
  { min: 85, max: 88,  label: '1.75 – Good' },
  { min: 82, max: 84,  label: '2.0 – Good' },
  { min: 78, max: 81,  label: '2.25 – Satisfactory' },
  { min: 75, max: 77,  label: '2.5 – Satisfactory' },
  { min: 70, max: 74,  label: '2.75 – Passing' },
  { min: 65, max: 69,  label: '3.0 – Passing' },
  { min: 55, max: 64,  label: '4.0 – Conditional Fail' },
  { min: 0,  max: 54,  label: '5.0 – Fail' },
]

export const SCALE_PASSFAIL = [
  { min: 75, max: 100, label: 'P – Pass' },
  { min: 0,  max: 74,  label: 'F – Fail' },
]

export type ScaleAssignment = {
  programKey: string
  levelName:  string
  scaleName:  string
  ranges:     object
}

export function buildScaleAssignments(): ScaleAssignment[] {
  const out: ScaleAssignment[] = []

  for (const name of ['Daycare 1', 'Daycare 2']) {
    out.push({ programKey: 'daycare', levelName: name, scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL })
  }
  for (const name of ['Kinder 1', 'Kinder 2']) {
    out.push({ programKey: 'kinder', levelName: name, scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL })
  }
  for (let g = 1; g <= 6; g++) {
    out.push({ programKey: 'elementary', levelName: `Grade ${g}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
  }
  for (let g = 7; g <= 10; g++) {
    out.push({ programKey: 'jhs', levelName: `Grade ${g}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
  }
  for (const strand of SHS_STRANDS) {
    for (const g of [11, 12]) {
      out.push({ programKey: 'shs', levelName: `Grade ${g} – ${strand}`, scaleName: 'K-12 Scale', ranges: SCALE_K12 })
    }
  }
  for (const course of COLLEGE_COURSES) {
    for (let y = 1; y <= course.years; y++) {
      out.push({
        programKey: 'college',
        levelName:  `${course.code} – ${YEAR_LABELS[y - 1]}`,
        scaleName:  'College Numeric Scale (1.0–5.0)',
        ranges:     SCALE_COLLEGE,
      })
    }
  }

  return out
}
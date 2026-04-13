import { COLLEGE_COURSES } from './courses.data'

export const SCALE_K12 = [
  { minPercent: 90, maxPercent: 100, gradeValue: '1.0', remark: 'Outstanding', isPassing: true },
  { minPercent: 85, maxPercent: 89, gradeValue: '2.0', remark: 'Very Satisfactory', isPassing: true },
  { minPercent: 80, maxPercent: 84, gradeValue: '3.0', remark: 'Satisfactory', isPassing: true },
  { minPercent: 75, maxPercent: 79, gradeValue: '4.0', remark: 'Fairly Satisfactory', isPassing: true },
  { minPercent: 0, maxPercent: 74, gradeValue: '5.0', remark: 'Did Not Meet', isPassing: false },
]

export const SCALE_COLLEGE = [
  { minPercent: 97, maxPercent: 100, gradeValue: '1.0', remark: 'Excellent', isPassing: true },
  { minPercent: 93, maxPercent: 96, gradeValue: '1.25', remark: 'Very Good', isPassing: true },
  { minPercent: 89, maxPercent: 92, gradeValue: '1.5', remark: 'Very Good', isPassing: true },
  { minPercent: 85, maxPercent: 88, gradeValue: '1.75', remark: 'Good', isPassing: true },
  { minPercent: 82, maxPercent: 84, gradeValue: '2.0', remark: 'Good', isPassing: true },
  { minPercent: 78, maxPercent: 81, gradeValue: '2.25', remark: 'Satisfactory', isPassing: true },
  { minPercent: 75, maxPercent: 77, gradeValue: '2.5', remark: 'Satisfactory', isPassing: true },
  { minPercent: 70, maxPercent: 74, gradeValue: '2.75', remark: 'Passing', isPassing: true },
  { minPercent: 65, maxPercent: 69, gradeValue: '3.0', remark: 'Passing', isPassing: true },
  { minPercent: 55, maxPercent: 64, gradeValue: '4.0', remark: 'Conditional', isPassing: false },
  { minPercent: 0, maxPercent: 54, gradeValue: '5.0', remark: 'Fail', isPassing: false },
]

export const SCALE_PASSFAIL = [
  { minPercent: 75, maxPercent: 100, gradeValue: 'P', remark: 'Pass', isPassing: true },
  { minPercent: 0, maxPercent: 74, gradeValue: 'F', remark: 'Fail', isPassing: false },
]

export type ScaleAssignment = {
  programKey: string
  scaleName: string
  ranges: object
}

export function buildScaleAssignments(): ScaleAssignment[] {
  return [
    { programKey: 'daycare', scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL },
    { programKey: 'kinder', scaleName: 'Pass/Fail Scale', ranges: SCALE_PASSFAIL },
    { programKey: 'elementary', scaleName: 'K-12 Scale', ranges: SCALE_K12 },
    { programKey: 'jhs', scaleName: 'K-12 Scale', ranges: SCALE_K12 },
    { programKey: 'shs', scaleName: 'K-12 Scale', ranges: SCALE_K12 },
    { programKey: 'college', scaleName: 'College Numeric Scale', ranges: SCALE_COLLEGE },
  ]
}
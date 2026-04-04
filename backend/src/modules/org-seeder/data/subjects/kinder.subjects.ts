import { SubjectDef, subj } from './index'

const KINDER_AREAS = [
  'Language, Literacy, and Communication',
  'Mathematical Thinking',
  'Physical Development, Health, and Safety',
  'Social and Emotional Development / Values Formation',
  'Creative Arts',
  'Understanding the World / Discovery',
]

export function kinderSubjects(): SubjectDef[] {
  const out: SubjectDef[] = []
  for (const area of KINDER_AREAS) {
    out.push(subj('Kinder 1', null, null, area, 'Kinder 1', 'Whole Year'))
  }
  for (const area of KINDER_AREAS) {
    out.push(subj('Kinder 2', null, null, area, 'Kinder 2', 'Whole Year', [area]))
  }
  return out
}
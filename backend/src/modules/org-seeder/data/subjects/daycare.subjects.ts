import { SubjectDef, subj } from './index';

const DAYCARE_AREAS = [
  'Language and Literacy',
  'Cognitive and Numeracy Skills',
  'Physical Development, Health, and Safety',
  'Social and Emotional Development',
  'Creative Arts and Music',
  'Understanding the World / Discovery',
];

export function daycareSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (const area of DAYCARE_AREAS) {
    out.push(subj('Daycare 1', null, null, area, 'Daycare 1', 'Whole Year'));
  }
  for (const area of DAYCARE_AREAS) {
    out.push(
      subj('Daycare 2', null, null, area, 'Daycare 2', 'Whole Year', [
        `${area} (Daycare 1)`,
      ]),
    );
  }
  return out;
}

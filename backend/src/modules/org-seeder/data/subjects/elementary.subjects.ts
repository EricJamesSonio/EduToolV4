import { SubjectDef, subj } from './index';

const ELEM_CORE = [
  'English',
  'Mathematics',
  'Science',
  'Filipino',
  'Araling Panlipunan',
  'MAPEH',
  'Edukasyon sa Pagpapakatao (ESP)',
];

// null means no chained prereq
const ELEM_PREREQS: Record<string, string | null> = {
  English: 'English',
  Mathematics: 'Mathematics',
  Science: 'Science',
  Filipino: 'Filipino',
  'Araling Panlipunan': 'Araling Panlipunan',
  MAPEH: null,
  'Edukasyon sa Pagpapakatao (ESP)': null,
};

export function elementarySubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (let g = 1; g <= 6; g++) {
    for (const subjectName of ELEM_CORE) {
      const prereq = ELEM_PREREQS[subjectName];
      const prereqNames = prereq && g > 1 ? [prereq] : [];
      out.push(
        subj(
          `Grade ${g}`,
          null,
          null,
          subjectName,
          `Grade ${g}`,
          'Whole Year',
          prereqNames,
        ),
      );
    }
  }
  return out;
}

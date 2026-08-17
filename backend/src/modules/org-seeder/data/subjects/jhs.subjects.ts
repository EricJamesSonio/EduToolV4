import { SubjectDef, subj } from './index';

const JHS_CORE = [
  'English',
  'Mathematics',
  'Science',
  'Filipino',
  'Araling Panlipunan',
  'MAPEH',
  'Edukasyon sa Pagpapakatao (ESP)',
  'TLE',
];

const JHS_PREREQS: Record<string, string | null> = {
  English: 'English',
  Mathematics: 'Mathematics',
  Science: 'Science',
  Filipino: 'Filipino',
  'Araling Panlipunan': 'Araling Panlipunan',
  MAPEH: null,
  'Edukasyon sa Pagpapakatao (ESP)': null,
  TLE: 'TLE',
};

export function jhsSubjects(): SubjectDef[] {
  const out: SubjectDef[] = [];
  for (let g = 7; g <= 10; g++) {
    for (const subjectName of JHS_CORE) {
      const prereq = JHS_PREREQS[subjectName];
      const prereqNames = prereq ? [prereq] : [];
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

import { COLLEGE_COURSES, BSED_MAJORS } from './courses.data';
import { SHS_STRAND_DEFS } from './strands.data';

export type SectionDef = { name: string; capacity: number };
export type LevelDef = {
  programKey: string;
  courseCode?: string;
  strandCode?: string;
  name: string;
  sections: SectionDef[];
};

const s3x50 = (): SectionDef[] => [
  { name: 'Section A', capacity: 50 },
  { name: 'Section B', capacity: 50 },
  { name: 'Section C', capacity: 50 },
];

const s3x40 = (): SectionDef[] => [
  { name: 'Section A', capacity: 40 },
  { name: 'Section B', capacity: 40 },
  { name: 'Section C', capacity: 40 },
];

const s2x40 = (): SectionDef[] => [
  { name: 'Section A', capacity: 40 },
  { name: 'Section B', capacity: 40 },
];

const s2x30 = (): SectionDef[] => [
  { name: 'Section A', capacity: 30 },
  { name: 'Section B', capacity: 30 },
];

export const YEAR_LABELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
];

export function buildLevelDefs(): LevelDef[] {
  const defs: LevelDef[] = [];

  defs.push(
    { programKey: 'daycare', name: 'Daycare 1', sections: s2x40() },
    { programKey: 'daycare', name: 'Daycare 2', sections: s2x40() },
    { programKey: 'kinder', name: 'Kinder 1', sections: s2x30() },
    { programKey: 'kinder', name: 'Kinder 2', sections: s2x30() },
  );

  for (let g = 1; g <= 6; g++) {
    defs.push({
      programKey: 'elementary',
      name: `Grade ${g}`,
      sections: s3x40(),
    });
  }

  for (let g = 7; g <= 10; g++) {
    defs.push({ programKey: 'jhs', name: `Grade ${g}`, sections: s3x40() });
  }

  // SHS levels are now per-strand, mirroring how college levels are per-course —
  // each strand gets its own Grade 11 / Grade 12 rows, not one shared pair.
  for (const strand of SHS_STRAND_DEFS) {
    defs.push(
      {
        programKey: 'shs',
        strandCode: strand.name,
        name: 'Grade 11',
        sections: s3x40(),
      },
      {
        programKey: 'shs',
        strandCode: strand.name,
        name: 'Grade 12',
        sections: s3x40(),
      },
    );
  }

  for (const course of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
    for (let y = 1; y <= course.years; y++) {
      defs.push({
        programKey: 'college',
        courseCode: course.code,
        name: YEAR_LABELS[y - 1],
        sections: s3x50(),
      });
    }
  }

  return defs;
}

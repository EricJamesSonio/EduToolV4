// Leaf module: shared subject shape + factory.
// Imported by every *.subjects.ts data file, so it must never import them
// back (directly or through ./index) — that was the barrel cycle.

export type SubjectDef = {
  levelName: string;
  courseCode: string | null;
  strandName: string | null;
  name: string;
  yearLevel: string;
  termLabel: string;
  prereqNames: string[];
  isMinor: boolean; // ← new: true = subject_type 'minor'
};

export function subj(
  levelName: string,
  courseCode: string | null,
  strandName: string | null,
  name: string,
  yearLevel: string,
  termLabel: string,
  prereqNames: string[] = [],
  isMinor = false, // ← new param, defaults to false
): SubjectDef {
  return {
    levelName,
    courseCode,
    strandName,
    name,
    yearLevel,
    termLabel,
    prereqNames,
    isMinor,
  };
}

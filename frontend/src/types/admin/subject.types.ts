export type SubjectLockStatus = "unlocked" | "locked";
export type SubjectType = "major" | "minor";

export interface SubjectSharing {
  id: string;
  orgId: string;
  subjectId: string;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
  levelId: string | null;
  levelName: string | null;
}

export interface Subject {
  id: string;
  orgId: string;
  title: string;
  subjectType: SubjectType;

  // "levelId / levelName" — kept for backwards compat (backend still returns these)
  // These map to the level the subject belongs to (major) or home level (minor)
  programId: string;       // ← still the level_id from the backend (legacy field name)
  programName: string;     // ← still the levelName from the backend (legacy field name)

  // Real program (for minor subjects)
  realProgramId: string | null;

  levelId: string | null;  // explicit level_id field
  courseId: string | null;
  strandId: string | null;
  educatorId: string | null;
  educatorName: string | null;
  lockStatus: SubjectLockStatus;
  yearLevel: string | null;
  termLabel: string | null;
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: SubjectSharing[];
  createdAt: string;
  updatedAt: string;
}
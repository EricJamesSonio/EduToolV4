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

  programId: string;
  programName: string;
  programType: string | null

  realProgramId: string | null;

  levelId: string | null;
  levelName: string | null;

  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;

  educatorId: string | null;
  educatorName: string | null;

  lockStatus: SubjectLockStatus;

  yearLevel: string | null;
  termLabel: string | null;

  /** Explicit weekly requirement, or null to mean "use the program default". */
  sessionsPerWeek: number | null;
  sessionMinutes: number | null;
  /** Effective values after default resolution. Always populated. */
  effectiveSessionsPerWeek: number;
  effectiveSessionMinutes: number;
  sessionRequirementSource: "explicit" | "default";

  prerequisites: unknown[];
  prereqFor: unknown[];

  sharings: SubjectSharing[];

  createdAt: string;
  updatedAt: string;
}
export type SubjectLockStatus = "unlocked" | "locked";
export type SubjectType = "major" | "minor";
/** Subjects page tabs: active lists plus the read-only Archived tab. */
export type SubjectTab = SubjectType | "archived";

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

  /** ISO timestamp when archived; null while active. */
  deletedAt: string | null;
  /** Linked class count — populated on archived listings, null otherwise. */
  classCount: number | null;

  yearLevel: string | null;
  termLabel: string | null;

  /** Explicit weekly requirement, or null to mean "use the program default". */
  sessionsPerWeek: number | null;
  sessionMinutes: number | null;
  /** Stored per-position lengths. Empty means uniform. */
  sessionDurations: number[];
  /** Effective values after default resolution. Always populated. */
  effectiveSessionsPerWeek: number;
  effectiveSessionMinutes: number;
  /**
   * Resolved length of each session. Always `effectiveSessionsPerWeek` long,
   * so the UI can render one row per meeting without re-deriving anything.
   */
  effectiveSessionDurations: number[];
  sessionRequirementSource: "explicit" | "default";

  prerequisites: unknown[];
  prereqFor: unknown[];

  sharings: SubjectSharing[];

  createdAt: string;
  updatedAt: string;
}
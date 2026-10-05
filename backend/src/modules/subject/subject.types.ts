// filepath: backend/src/modules/subject/subject.types.ts

export interface SubjectProgramRelation {
  name: string | null;
  type: string | null;
}

export interface SubjectRecord {
  id: string;
  org_id: string;
  name: string;
  subject_type: string | null;
  program_id: string | null;
  program: SubjectProgramRelation | null;
  level_id: string | null;
  levelName: string | null;
  course_id: string | null;
  courseName: string | null;
  strand_id: string | null;
  strandName: string | null;
  is_locked: boolean;
  /** Set when the subject is archived (soft-deleted). Null while active. */
  deleted_at?: Date | string | null;
  year_level: number | string | null;
  term_label: string | null;
  sessions_per_week: number | null;
  session_minutes: number | null;
  /** Per-position lengths; empty = uniform. */
  session_durations: number[];
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
  /** Linked class count — attached only on archived listings. */
  classCount?: number;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ProgramRecord {
  id: string;
  type: string;
}

export interface CourseRecord {
  id: string;
  program_id: string;
}

export interface StrandRecord {
  id: string;
  program_id: string;
}

export interface LevelRecord {
  id: string;
  program_id: string;
}

export interface SubjectResponse {
  id: string;
  orgId: string;
  title: string;
  subjectType: string;
  programId: string | null;
  programName: string | null;
  programType: string | null;
  realProgramId: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
  lockStatus: 'locked' | 'unlocked';
  /** ISO timestamp when archived; null while active. */
  deletedAt?: Date | string | null;
  yearLevel: number | string | null;
  termLabel: string | null;
  /** Explicit weekly requirement, or null to mean "use the program default". */
  sessionsPerWeek: number | null;
  sessionMinutes: number | null;
  /** Stored per-position lengths. Empty means uniform. */
  sessionDurations: number[];
  /** Effective values after default resolution. Always populated. */
  effectiveSessionsPerWeek: number;
  effectiveSessionMinutes: number;
  /** Resolved length of each session. Always effectiveSessionsPerWeek long. */
  effectiveSessionDurations: number[];
  /** Whether the effective values came from the subject or the default. */
  sessionRequirementSource: 'explicit' | 'default';
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
  /** Linked class count — populated on archived listings, null otherwise. */
  classCount: number | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}
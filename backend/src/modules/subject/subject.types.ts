// filepath: backend/src/modules/subject/subject.types.ts

export interface SubjectProgramRelation {
  name: string | null;
  type: string | null;
}

export interface SubjectRecord {
  id: string;
  org_id: string;
  name: string;
  code: string | null;
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
  deleted_at?: Date | string | null;
  year_level: number | string | null;
  term_label: string | null;
  sessions_per_week: number | null;
  session_minutes: number | null;
  session_durations: number[];
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
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
  code: string | null;
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
  deletedAt?: Date | string | null;
  yearLevel: number | string | null;
  termLabel: string | null;
  sessionsPerWeek: number | null;
  sessionMinutes: number | null;
  sessionDurations: number[];
  effectiveSessionsPerWeek: number;
  effectiveSessionMinutes: number;
  effectiveSessionDurations: number[];
  sessionRequirementSource: 'explicit' | 'default';
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
  classCount: number | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}
/** One section × subject the generator believes is needed. */
export interface GeneratedItem {
  sectionId: string;
  sectionName: string;
  levelId: string;
  levelName: string;
  subjectId: string;
  subjectName: string;
  educatorId: string | null;
  educatorName: string | null;
  sessionsPerWeek: number;
  sessionMinutes: number;
  slots: { weekday: number; startMin: number; endMin: number }[];
  warnings: string[];
  /** Set when the generator could not place this item at all. */
  unplacedReason?: string;
}

export type GeneratorReadinessSeverity = "blocking" | "warning";

export type GeneratorReadinessEntityType =
  | "program"
  | "subject"
  | "section"
  | "educator";

export interface GeneratorReadinessEntity {
  id: string;
  name: string;
  type: GeneratorReadinessEntityType;
}

export interface GeneratorReadinessIssue {
  code: string;
  severity: GeneratorReadinessSeverity;
  message: string;
  count?: number;
  entities?: GeneratorReadinessEntity[];
  ref?: { type: GeneratorReadinessEntityType; id: string; name: string };
}

export interface GenerateReadiness {
  ok: boolean;
  activeWeekdays: number[];
  warnings: string[];
  blockers: string[];
  issues: GeneratorReadinessIssue[];
}

export interface GeneratePreview {
  items: GeneratedItem[];
  readiness: GenerateReadiness;
  placedCount: number;
  unplacedCount: number;
}

export interface GenerateRequest {
  schoolYearId: string;
  programIds: string[];
  semesterId: string;
  /** Narrow to these sections. Omit/empty = every section in scope. */
  sectionIds?: string[];
  windowStart?: string;
  windowEnd?: string;
  maxItems?: number;
}

/** One educator row of the generate page's roster panel. */
export interface GeneratorRosterEducator {
  educatorId: string;
  name: string | null;
  useCustomAvailability: boolean;
  effectiveWeekdays: number[];
  /** Subject ids (in the selected school year) this educator can teach. */
  teachableSubjectIds: string[];
  /** Sections this educator handles, keyed by subject id. */
  sectionsBySubject: Record<string, string[]>;
  /** Weekly slot positions picked per section, keyed by subject then section. */
  slotsBySubject: Record<string, Record<string, number[]>>;
}

export interface GeneratorRoster {
  educators: GeneratorRosterEducator[];
  activeWeekdays: number[];
}

export interface CommitGenerateRequest extends GenerateRequest {
  /** The admin confirmed they reviewed the preview. Required by the API. */
  confirmed: boolean;
}

export interface CommitGenerateResponse {
  created: number;
  skipped: { reason: string; detail: string }[];
}

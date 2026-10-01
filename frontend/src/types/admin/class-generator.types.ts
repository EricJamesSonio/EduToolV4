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

export interface GenerateReadiness {
  ok: boolean;
  activeWeekdays: number[];
  warnings: string[];
  blockers: string[];
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
  windowStart?: string;
  windowEnd?: string;
  maxItems?: number;
}

export interface CommitGenerateRequest extends GenerateRequest {
  /** The admin confirmed they reviewed the preview. Required by the API. */
  confirmed: boolean;
}

export interface CommitGenerateResponse {
  created: number;
  skipped: { reason: string; detail: string }[];
}

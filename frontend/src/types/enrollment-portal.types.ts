// src/types/enrollment-portal.types.ts
// Shared type definitions for the public enrollment portal + registrar admin UI.

export type EnrollmentApplicationStatus = "pending" | "locked" | "approved" | "rejected";

// ── Public portal catalog (GET /enroll/:orgSlug/:periodToken) ──────────────

export interface PublicLevelRef {
  id: string;
  name: string;
}

export interface PublicCourse {
  id: string;
  name: string;
  code: string | null;
  levels: PublicLevelRef[];
}

export interface PublicStrand {
  id: string;
  name: string;
  levels: PublicLevelRef[];
}

export interface PublicProgram {
  id: string;
  name: string;
  type: string;
  courses: PublicCourse[];
  strands: PublicStrand[];
  levels: PublicLevelRef[];
}

export interface PublicPortalInfo {
  org: { id: string; name: string; slug: string };
  period: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    lock_date: string;
    is_open: boolean;
  };
  schoolYear: { id: string; name: string };
  programs: PublicProgram[];
}

// ── Application view returned by the public API ─────────────────────────────

export interface EnrollmentApplicationView {
  id: string;
  application_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age: number | null;
  address: string | null;
  contact_number: string | null;
  last_school_graduated: string | null;
  program_id: string;
  course_id: string | null;
  strand_id: string | null;
  level_id: string;
  status: EnrollmentApplicationStatus;
  rejection_reason: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface VerifyOtpResult {
  mode: "create" | "edit";
  token: string;
  application?: EnrollmentApplicationView;
}

export interface PublicApplicationLookup {
  application_code: string;
  full_name: string;
  status: EnrollmentApplicationStatus;
}

// ── Registrar admin ─────────────────────────────────────────────────────────

export interface EnrollmentPeriod {
  id: string;
  name: string;
  token: string;
  start_date: string;
  end_date: string;
  lock_date: string;
  created_by: string;
  created_at?: string;
  school_year?: { id: string; name: string } | null;
}

export interface PeriodListResponse {
  org: { id: string | null; name: string | null; slug: string | null };
  periods: Array<
    EnrollmentPeriod & {
      counts?: EnrollmentPeriodStatusCounts;
      total?: number;
    }
  >;
}

export interface CreateEnrollmentPeriodInput {
  name: string;
  school_year_id: string;
  start_date: string;
  end_date: string;
  lock_date: string;
}

export interface ApplicationListItem {
  id: string;
  application_code: string;
  personal_email: string;
  full_name: string;
  status: EnrollmentApplicationStatus;
  program: string;
  course: string | null;
  strand: string | null;
  level: string;
  period: string;
  submitted_at: string;
}

export interface PaginatedApplications {
  data: ApplicationListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ApplicationDetail extends EnrollmentApplicationView {
  personal_email: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  locked_at: string | null;
  unlocked_by: string | null;
  unlocked_at: string | null;
  resulting_account_id: string | null;
  program: { id: string; name: string } | null;
  course: { id: string; name: string } | null;
  strand: { id: string; name: string } | null;
  level: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  period: { id: string; name: string; token: string } | null;
  school_year: { id: string; name: string } | null;
}

export interface ApproveApplicationResult {
  success: boolean;
  application_id: string;
  section: { id: string; name: string } | null;
}

export interface ActionApplicationResult {
  success: boolean;
  application: EnrollmentApplicationView;
}

// ── Public apply-flow form state ───────────────────────────────────────────

export type ApplicationDraftStep = "identity" | "personal" | "program" | "review" | "success";

/**
 * All fields the applicant fills out on the public portal. Mirrors the
 * upsert payload but keeps every value a string (form-native).
 */
export interface ApplicationDraft {
  first_name: string;
  middle_name: string;
  last_name: string;
  age: string;
  address: string;
  contact_number: string;
  last_school_graduated: string;
  program_id: string;
  course_id: string;
  strand_id: string;
  level_id: string;
}

export const emptyApplicationDraft: ApplicationDraft = {
  first_name: "",
  middle_name: "",
  last_name: "",
  age: "",
  address: "",
  contact_number: "",
  last_school_graduated: "",
  program_id: "",
  course_id: "",
  strand_id: "",
  level_id: "",
};

const DRAFT_KEYS = Object.keys(emptyApplicationDraft) as (keyof ApplicationDraft)[];

const MAX_FIELD_LENGTH = 512;

/**
 * Safely rebuilds an ApplicationDraft from persisted input.
 * Restores only the known fields, coerces everything to a trimmed string and
 * caps field length — rejects injected/unknown keys and out-of-range values.
 */
export function sanitizeApplicationDraft(raw: unknown): ApplicationDraft {
  const out: ApplicationDraft = { ...emptyApplicationDraft };
  if (!raw || typeof raw !== "object") return out;
  const source = raw as Record<string, unknown>;
  for (const key of DRAFT_KEYS) {
    const value = source[key];
    if (typeof value === "string" || typeof value === "number") {
      out[key] = String(value).slice(0, MAX_FIELD_LENGTH);
    }
  }
  return out;
}

/**
 * Maps a stored step back to the furthest safe step the applicant can resume
 * after identity is re-verified. Anything unknown falls back to "personal".
 */
export function resumeApplicationStep(savedStep: string): "personal" | "program" | "review" {
  if (savedStep === "review") return "review";
  if (savedStep === "program") return "program";
  return "personal";
}

// ── Registrar dashboard ────────────────────────────────────────────────────

export type EnrollmentPeriodPhase = "upcoming" | "open" | "locked" | "ended";

export interface EnrollmentPeriodStatusCounts {
  pending: number;
  locked: number;
  approved: number;
  rejected: number;
}

export interface EnrollmentPeriodSummary {
  id: string;
  name: string;
  token: string;
  start_date: string;
  end_date: string;
  lock_date: string;
  school_year: { id: string; name: string } | null;
  status: EnrollmentPeriodPhase;
  counts: EnrollmentPeriodStatusCounts;
  total: number;
}

export interface ProgramCountRow {
  applied: number;
  enrolled: number;
}

export interface ProgramLevelCount extends ProgramCountRow {
  id: string;
  name: string;
}

export interface ProgramCourseCount extends ProgramCountRow {
  id: string;
  name: string;
  levels: ProgramLevelCount[];
}

export interface ProgramOverview extends ProgramCountRow {
  id: string;
  name: string;
  type: string;
  applied: number;
  approved: number;
  courses: ProgramCourseCount[];
  strands: ProgramLevelCount[];
  levels: ProgramLevelCount[];
}

export interface EnrollmentPortalDashboard {
  org: { id: string | null; name: string | null; slug: string | null };
  availablePeriods: EnrollmentPeriodSummary[];
  dashboard: {
    period: {
      id: string;
      name: string;
      token: string;
      start_date: string;
      end_date: string;
      lock_date: string;
      school_year: { id: string; name: string } | null;
      status: EnrollmentPeriodPhase;
    };
    summary: EnrollmentPeriodStatusCounts;
    total: number;
    programs: ProgramOverview[];
  } | null;
}

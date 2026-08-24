export type SchoolYearEnrollmentStatus =
  | "active"
  | "pending"
  | "unenrolled";

export type ProgramEnrollmentStatus = "active" | "ended";

export interface ProgramEnrollmentSnapshot {
  id:         string;
  program_id: string;
  program:    { id: string; name: string; type: string };
  level:      { id: string; name: string } | null;
  course:     { id: string; name: string; code: string | null } | null;
  strand:     { id: string; name: string } | null;
  section:    { id: string; name: string } | null;
  status:     ProgramEnrollmentStatus;
  enrolled_at: string;
  section_assigned_at?: string | null;
  end_reason?: string | null;
  ended_at?: string | null;
  ended_by?: string | null;
}

export interface StudentSchoolYearEnrollment {
  id:             string;
  org_id:         string;
  student_id:     string;
  school_year_id: string;
  status:         SchoolYearEnrollmentStatus;
  enrolled_at:    string;
  unenrolled_at:  string | null;
  notes:          string | null;
  programEnrollments: ProgramEnrollmentSnapshot[];
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface EnrollStudentRequest {
  student_id: string;
  notes?:     string;
}

export interface BulkEnrollStudentsRequest {
  students: EnrollStudentRequest[];
}

export interface UpdateSchoolYearEnrollmentRequest {
  status: SchoolYearEnrollmentStatus;
  notes?: string;
}

export interface EnrollStudentProgramRequest {
  program_id:  string;
  level_id?:   string;
  course_id?:  string;
  strand_id?:  string;
  section_id?: string;
}

export interface UpdateProgramEnrollmentRequest {
  level_id?:   string | null;
  course_id?:  string | null;
  strand_id?:  string | null;
  section_id?: string | null;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface BulkEnrollResult {
  enrolled: string[];
  failed:   { student_id: string; reason: string }[];
}
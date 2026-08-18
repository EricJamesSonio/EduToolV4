// src/modules/auth/entity/admin-request-session.entity.ts

export interface AdminRequestSessionClaims {
  type: 'admin-request';
  email: string;
  requestId: string | null;
}

/** Public view of a RegistrationRequest returned to its own applicant. */
export interface RegistrationRequestView {
  id: string;
  email: string;
  full_name: string;
  plan: string | null;
  institution_name: string | null;
  role: string | null;
  student_count: string | null;
  programs_departments: string | null;
  status: string;
  revision_notes: Record<string, string> | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrgEnrollmentSetting {
  org_id:                        string;
  require_semester_reenrollment: boolean;
  auto_unenroll_on_year_end:     boolean;
}

export interface UpsertOrgEnrollmentSettingRequest {
  require_semester_reenrollment?: boolean;
  auto_unenroll_on_year_end?:     boolean;
}
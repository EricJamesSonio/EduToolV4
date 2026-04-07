export class OrgEnrollmentSettingEntity {
  id:                            string
  org_id:                        string
  require_semester_reenrollment: boolean
  auto_unenroll_on_year_end:     boolean
  created_at:                    Date
  updated_at:                    Date
}
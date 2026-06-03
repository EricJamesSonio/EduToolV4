export const PAGE_SIZE = 20;

export const ADMIN_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all",                        label: "All Actions" },
  { value: "student_profile_changed",    label: "Student Profile Changed" },
  { value: "student_status_changed",     label: "Student Status Changed" },
  { value: "enrollment_created",         label: "Enrollment Created" },
  { value: "enrollment_removed",         label: "Enrollment Removed" },
  { value: "password_reset",             label: "Password Reset" },
  { value: "class_reassigned",           label: "Class Reassigned" },
  { value: "grade_lock_override",        label: "Grade Lock Override" },
  { value: "section_capacity_overflow",  label: "Section Capacity Overflow" },
  { value: "class_capacity_overflow",    label: "Class Capacity Overflow" },
  { value: "academic_calendar_changed",  label: "Academic Calendar Changed" },
  { value: "GRADE_LOCK",                 label: "Grade Lock" },
  { value: "GRADE_UNLOCK_OVERRIDE",      label: "Grade Unlock Override" },
  { value: "AUTO_GRADE_LOCK",            label: "Auto Grade Lock" },
];

export const ACTIVITY_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all",                           label: "All Actions" },
  { value: "enrollment_created",            label: "Enrollment Created" },
  { value: "enrollment_removed",            label: "Enrollment Removed" },
  { value: "meeting_started",               label: "Meeting Started" },
  { value: "meeting_ended",                 label: "Meeting Ended" },
  { value: "assessment_created",            label: "Assessment Created" },
  { value: "assessment_edited",             label: "Assessment Edited" },
  { value: "assessment_published",          label: "Assessment Published" },
  { value: "assessment_deleted",            label: "Assessment Deleted" },
  { value: "score_published",               label: "Score Published" },
  { value: "score_unpublished",             label: "Score Unpublished" },
  { value: "grade_locked",                  label: "Grade Locked" },
  { value: "lesson_created",                label: "Lesson Created" },
  { value: "lesson_updated",                label: "Lesson Updated" },
  { value: "concept_extraction_requested",  label: "Concept Extraction Requested" },
  { value: "concept_extraction_completed",  label: "Concept Extraction Completed" },
  { value: "class_reassigned",              label: "Class Reassigned" },
];

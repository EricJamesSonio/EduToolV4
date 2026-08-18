// @/modules/audit-log/entity/audit-log.entity.ts

// ── Admin audit log action types ──────────────────────────────────────────────
export type AdminActionType =
  | 'org_created'
  | 'org_updated'
  | 'org_seeded'
  | 'school_year_created'
  | 'school_year_updated'
  | 'school_year_activated'
  | 'school_year_ended'
  | 'school_year_deleted'
  | 'program_created'
  | 'program_updated'
  | 'program_deleted'
  | 'section_created'
  | 'section_updated'
  | 'section_deleted'
  | 'class_created'
  | 'class_archived'
  | 'class_reassigned'
  | 'student_profile_changed'
  | 'student_status_changed'
  | 'enrollment_created'
  | 'enrollment_removed'
  | 'enrollment_updated'
  | 'password_reset'
  | 'grade_lock_override'
  | 'GRADE_LOCK'
  | 'GRADE_UNLOCK_OVERRIDE'
  | 'AUTO_GRADE_LOCK'
  | 'section_capacity_overflow'
  | 'class_capacity_overflow'
  | 'academic_calendar_changed';

// ── Educator activity log event types ────────────────────────────────────────
export type EducatorActivityType =
  | 'enrollment_created'
  | 'enrollment_removed'
  | 'meeting_started'
  | 'meeting_ended'
  | 'assessment_created'
  | 'assessment_edited'
  | 'assessment_published'
  | 'assessment_deleted'
  | 'assessment_reopened'
  | 'assessment_questions_generated'
  | 'students_assigned_to_assessment'
  | 'score_published'
  | 'score_unpublished'
  | 'grade_locked'
  | 'lesson_created'
  | 'lesson_updated'
  | 'concept_extraction_requested'
  | 'concept_extraction_completed'
  | 'class_reassigned';

export class AuditLogEntity {
  id: string;
  orgId: string;
  actorId: string;
  logType: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

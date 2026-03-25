// @/modules/audit-log/entity/audit-log.entity.ts

// ── Admin audit log action types ──────────────────────────────────────────────
export type AdminActionType =
  | 'student_profile_changed'
  | 'student_status_changed'
  | 'enrollment_created'
  | 'enrollment_removed'
  | 'password_reset'
  | 'class_reassigned'
  | 'grade_lock_override'
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
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
}
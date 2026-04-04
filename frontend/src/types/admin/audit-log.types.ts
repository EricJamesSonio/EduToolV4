// frontend/src/types/admin/audit-log.types.ts

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

export interface AuditLog {
  id: string;
  orgId: string;
  actorId: string;
  action: AdminActionType | string;  // string fallback for unknown future actions
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  actorId: string;
  action: EducatorActivityType | string;
  entityType: string;
  entityId: string;   // classId in activity log context
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
// src/modules/notification/entity/notification.entity.ts

export type NotificationType =
  | 'enrollment_created'
  | 'enrollment_removed'
  | 'assessment_released'
  | 'assessment_deadline'
  | 'score_published'
  | 'grade_locked'
  | 'grade_lock_window'
  | 'grade_auto_locked'
  | 'class_reassigned'
  | 'meeting_created'
  | 'concept_extraction_completed'
  | 'assessment_generation_completed'
  | 'section_capacity_overflow'
  | 'class_capacity_overflow';

export class NotificationEntity {
  id: string;
  orgId: string;
  accountId: string;
  type: NotificationType;
  payload: Record<string, any>; // flexible — varies per notification type
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
}
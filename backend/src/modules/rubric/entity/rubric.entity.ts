// @/modules/rubric/entity/rubric.entity.ts

export type RubricCategoryType = 'assessment_linked' | 'manual_entry';

export type AssessmentType = 'quiz' | 'activity' | 'exam' | 'custom';

export class RubricCategoryEntity {
  name: string;              // e.g. "Quizzes", "Attendance", "Recitation"
  type: RubricCategoryType;
  weight: number;            // percentage, all must sum to 100
  assessmentTypes?: AssessmentType[]; // only for assessment_linked
}

export class RubricEntity {
  id: string;
  orgId: string;
  name: string;
  isDefault: boolean;        // true = org default (Admin-managed)
  educatorId: string | null; // null for org default
  classId: string | null;    // set when rubric is assigned to a class
  isLocked: boolean;
  lockedAt: Date | null;
  categories: RubricCategoryEntity[];
  createdAt: Date;
}
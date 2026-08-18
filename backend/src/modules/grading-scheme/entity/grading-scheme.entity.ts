export type ComponentType =
  | 'written_work'
  | 'performance_task'
  | 'quarterly_assessment'
  | 'exam'
  | 'quiz'
  | 'project'
  | 'recitation'
  | 'attendance'
  | 'activity'
  | 'custom'
  | 'manual'
  | 'other';

export class GradingSchemeComponentEntity {
  id!: string;
  orgId!: string;
  gradingSchemeId!: string;
  name!: string;
  type!: ComponentType;
  weight!: number;
  maxScore!: number | null;
  isOptional!: boolean;
  createdAt!: Date;
}

export class GradingSchemeEntity {
  id!: string;
  orgId!: string;
  classId!: string;
  templateId!: string | null; // trace origin template
  name!: string;
  isLocked!: boolean;
  lockedAt!: Date | null;
  createdAt!: Date;
  components!: GradingSchemeComponentEntity[];
}

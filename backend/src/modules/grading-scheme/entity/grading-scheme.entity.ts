export type ComponentType = 'quiz' | 'activity' | 'exam' | 'custom' | 'manual';

export class GradingSchemeComponentEntity {
  id: string;
  orgId: string;
  gradingSchemeId: string;
  name: string;
  type: ComponentType;   // explicit — used for assessment & manual score matching
  weight: number;        // percentage; all non-optional components must sum to 100
  maxScore: number | null;
  isOptional: boolean;
  createdAt: Date;
}

export class GradingSchemeEntity {
  id: string;
  orgId: string;
  educatorId: string | null; // null = org default (admin-managed)
  classId: string | null;    // set when assigned to a class
  name: string;
  isDefault: boolean;        // true = org default
  isLocked: boolean;         // locked once students are enrolled
  lockedAt: Date | null;
  createdAt: Date;
  components: GradingSchemeComponentEntity[];
}
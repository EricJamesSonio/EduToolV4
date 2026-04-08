// filepath: src/modules/grading-scheme/entity/grading-scheme.entity.ts

export type ComponentType = 'quiz' | 'activity' | 'exam' | 'custom' | 'manual';

export class GradingSchemeComponentEntity {
  id:             string;
  orgId:          string;
  gradingSchemeId: string;
  name:           string;
  type:           ComponentType;
  weight:         number;
  maxScore:       number | null;
  isOptional:     boolean;
  createdAt:      Date;
}

export class GradingSchemeEntity {
  id:         string;
  orgId:      string;
  classId:    string;
  templateId: string | null; // trace origin template
  name:       string;
  isLocked:   boolean;
  lockedAt:   Date | null;
  createdAt:  Date;
  components: GradingSchemeComponentEntity[];
}
import type { AssessmentComponentType } from '../constants/assessment-type.constants';

// Canonical values come from `constants/assessment-type.constants.ts`.
// `manual` is a legacy extra kept for backwards compatibility — it is NOT
// part of the canonical 14 and its validation behavior is an open decision
// (see FOLLOW_UPS.md, TICK-ASSESS-001). Do not add new values here.
export type ComponentType = AssessmentComponentType | 'manual';

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

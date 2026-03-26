export type RubricCategoryType = "assessment_linked" | "manual";

export interface RubricCategory {
  id: string;
  name: string;
  weight: number;       // percentage, 0–100
  type: RubricCategoryType;
  order: number;
}

export interface Rubric {
  id: string;
  orgId: string;
  /** null = org default rubric; classId = class-scoped rubric */
  classId: string | null;
  categories: RubricCategory[];
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RubricTemplate {
  id: string;
  orgId: string;
  educatorId: string;
  name: string;
  categories: RubricCategory[];
  createdAt: string;
  updatedAt: string;
}
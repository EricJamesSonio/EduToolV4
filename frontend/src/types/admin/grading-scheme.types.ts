export type ComponentType =
  | 'written_work'
  | 'performance_task'
  | 'quarterly_assessment'
  | 'exam'
  | 'quiz'
  | 'assignment'
  | 'project'
  | 'recitation'
  | 'participation'
  | 'behavior'
  | 'attendance'
  | 'activity'
  | 'custom'
  | 'other'

export interface GradingSchemeComponent {
  id: string
  orgId: string
  gradingSchemeId: string
  name: string
  type: ComponentType
  weight: number // percentage; required components must sum to 100
  maxScore: number | null
  isOptional: boolean
  createdAt: string
}

export interface GradingScheme {
  id: string
  orgId: string
  classId: string
  templateId?: string | null
  name: string
  isLocked: boolean
  lockedAt: string | null
  createdAt: string
  components: GradingSchemeComponent[]
}

export interface GradingSchemeComponentDto {
  name: string
  type: ComponentType
  weight: number
  maxScore?: number | null
  isOptional?: boolean
}

export interface CreateGradingSchemeDto {
  name: string
  classId: string
  templateId?: string
  components: GradingSchemeComponentDto[]
}

export interface UpdateGradingSchemeDto {
  name?: string
  components?: GradingSchemeComponentDto[]
}

// Legacy rubric types for backward compatibility
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
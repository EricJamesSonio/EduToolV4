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
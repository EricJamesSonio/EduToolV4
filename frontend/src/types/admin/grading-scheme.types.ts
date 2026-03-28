export type ComponentType = 'quiz' | 'activity' | 'exam' | 'custom' | 'manual'

export interface GradingSchemeComponent {
  id:              string
  orgId:           string
  gradingSchemeId: string
  name:            string
  type:            ComponentType
  weight:          number       // percentage; required components must sum to 100
  maxScore:        number | null
  isOptional:      boolean
  createdAt:       string
}

export interface GradingScheme {
  id:         string
  orgId:      string
  educatorId: string | null  // null = org default (admin-managed)
  classId:    string | null  // set when assigned to a class
  name:       string
  isDefault:  boolean
  isLocked:   boolean        // locked once students are enrolled
  lockedAt:   string | null
  createdAt:  string
  components: GradingSchemeComponent[]
}

// ── DTOs mirroring backend ────────────────────────────────────────────────────

export interface GradingSchemeComponentDto {
  name:       string
  type:       ComponentType
  weight:     number
  maxScore?:  number | null
  isOptional?: boolean
}

export interface CreateGradingSchemeDto {
  name:       string
  components: GradingSchemeComponentDto[]
}

export interface UpdateGradingSchemeDto {
  name?:       string
  components?: GradingSchemeComponentDto[]
}

// Same shape as UpdateGradingSchemeDto — kept separate to mirror backend naming
export type UpdateDefaultGradingSchemeDto = UpdateGradingSchemeDto
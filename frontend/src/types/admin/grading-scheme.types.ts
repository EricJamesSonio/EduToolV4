export type GradingSchemeComponentType =
  | 'quiz'
  | 'exam'
  | 'activity'
  | 'manual'
  | 'attendance'

export interface GradingSchemeComponent {
  id:               string
  orgId:            string
  gradingSchemeId:  string
  name:             string
  type:             GradingSchemeComponentType
  weight:           number
  maxScore:         number | null
  isOptional:       boolean
  createdAt:        string
}

export interface GradingScheme {
  id:          string
  orgId:       string
  educatorId:  string | null
  classId:     string | null
  name:        string
  isDefault:   boolean
  isLocked:    boolean
  lockedAt:    string | null
  createdAt:   string
  components:  GradingSchemeComponent[]
}
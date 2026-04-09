// ========================================
// ENUMS / UNION TYPES
// ========================================

export type ComponentType =
  | 'quiz'
  | 'activity'
  | 'exam'
  | 'custom'
  | 'manual'

// ========================================
// COMPONENT (ACTUAL SCHEME)
// ========================================

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

// ========================================
// GRADING SCHEME (UPDATED)
// ========================================

export interface GradingScheme {
  id: string

  orgId: string

  // ✅ NOW REQUIRED (class-scoped)
  classId: string

  // ✅ NEW (template origin)
  templateId?: string | null

  name: string

  isDefault: boolean

  isLocked: boolean
  lockedAt: string | null

  createdAt: string

  components: GradingSchemeComponent[]
}

// ========================================
// TEMPLATE TYPES (NEW)
// ========================================

export interface GradingSchemeTemplate {
  id: string

  orgId: string

  name: string

  // optional: "college", "shs", etc.
  programType?: string | null

  createdAt: string

  components: GradingSchemeTemplateComponent[]
}

export interface GradingSchemeTemplateComponent {
  id: string

  orgId: string
  templateId: string

  name: string
  type: ComponentType

  weight: number
  maxScore?: number | null

  createdAt: string
}

// ========================================
// DTOs (CREATE / UPDATE)
// ========================================

export interface GradingSchemeComponentDto {
  name: string
  type: ComponentType
  weight: number
  maxScore?: number | null
  isOptional?: boolean
}

export interface CreateGradingSchemeDto {
  name: string

  // ✅ REQUIRED NOW (since class-scoped)
  classId: string

  // optional if creating from template
  templateId?: string

  components: GradingSchemeComponentDto[]
}

export interface UpdateGradingSchemeDto {
  name?: string
  components?: GradingSchemeComponentDto[]
}

// still valid
export type UpdateDefaultGradingSchemeDto = UpdateGradingSchemeDto

// ========================================
// APPLY TEMPLATE → PROGRAM (NEW)
// ========================================

export interface ApplyToProgramPayload {
  programId: string
  templateId: string

  name?: string
  overwriteExisting?: boolean
}
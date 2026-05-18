export type GradeLockStatus = 'unlocked' | 'locked' | 'auto_locked'

export interface GradeLockSetting {
  id: string
  org_id: string
  name: string
  description?: string | null
  lockType: 'hard' | 'soft' | 'flexible'
  lock_deadline?: string | null
  deadlineDays?: number | null
  allowOverride: boolean
  is_default: boolean
  created_at: string
}

export interface GradeLockClassSubject {
  id: string
  name: string
  program_id?: string | null
  course_id?: string | null
  strand_id?: string | null
  level_id?: string | null
  program?: { id: string; name: string } | null
  course?: { id: string; name: string } | null
  strand?: { id: string; name: string } | null
  level?: { id: string; name: string } | null
}

export interface GradeLockClass {
  id: string
  program_id?: string | null
  subject_id: string
  educator_id: string
  school_year_id: string
  subject?: GradeLockClassSubject | null
}

export interface GradeLock {
  id: string
  org_id: string
  class_id: string

  // ✅ add this
  setting_id?: string | null

  is_locked: boolean
  locked_by: string | null
  locked_at: string | null
  created_at: string

  lockStatus: GradeLockStatus
  deadline?: string | null

  className?: string
  educatorName?: string

  class: GradeLockClass
}

export interface GradeLockResponse {
  success: boolean
  gradeLock?: GradeLock
  reason?: string
}

export interface AutoLockResponse {
  success: boolean
  lockedCount: number
}
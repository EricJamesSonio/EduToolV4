export type GradeLockStatus = 'unlocked' | 'locked' | 'auto_locked'

export interface GradeLockSetting {
  id: string
  org_id: string
  school_year_id: string
  lock_deadline: string
  created_at: string
  updated_at: string
}

export interface GradeLock {
  id: string
  org_id: string
  class_id: string
  is_locked: boolean
  locked_by: string | null
  locked_at: string | null
  created_at: string
  // Flat fields for table display (from backend mapping)
  className?: string
  educatorName?: string
  semesterName?: string
  termName?: string
  lockStatus?: GradeLockStatus
  deadline?: string | null
  // Original nested structure for filters
  class?: {
    id: string
    subject_id: string
    educator_id: string
    school_year_id: string
    subject?: {
      id: string
      name: string
      program?: {
        id: string
        name: string
      } | null
      course?: {
        id: string
        name: string
      } | null
      strand?: {
        id: string
        name: string
      } | null
      level?: {
        id: string
        name: string
      } | null
    } | null
  }
}

export interface GradeLockOverride {
  classId: string
  termId: string
  reason: string
}

export interface GradeLockResponse {
  success: boolean
  gradeLock?: GradeLock
  reason?: string
}
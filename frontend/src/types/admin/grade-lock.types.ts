export type GradeLockStatus = "unlocked" | "locked" | "auto_locked"

export interface GradeLockSetting {
  id: string
  org_id: string
  school_year_id: string
  lock_deadline: string // ← CHANGED from deadline
  created_at: string // ← CHANGED from createdAt
  updated_at: string // ← CHANGED from updatedAt
}

export interface GradeLock {
  id: string
  org_id: string
  class_id: string // ← CHANGED from classId
  is_locked: boolean // ← CHANGED from lockStatus enum
  locked_by: string | null // ← NEW: who locked it
  locked_at: string | null // ← CHANGED from lockedAt
  created_at: string // ← NEW
  class?: {
    // ← CHANGED: optional relation
    id: string
    subject_id: string
    educator_id: string
    school_year_id: string
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
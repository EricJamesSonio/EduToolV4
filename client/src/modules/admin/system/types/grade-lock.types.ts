// client/src/modules/admin/system/types/grade-lock.types.ts

// ── Enums ────────────────────────────────────────────────────────────────────

export const LOCK_TYPES = ['hard', 'soft', 'flexible'] as const;
export type LockType = (typeof LOCK_TYPES)[number];

export const LOCK_TYPE_LABELS: Record<LockType, string> = {
  hard: 'Hard Lock',
  soft: 'Soft Lock',
  flexible: 'Flexible',
};

export type LockStatus = 'locked' | 'auto_locked' | 'unlocked';

// ── Setting ───────────────────────────────────────────────────────────────────

export interface GradeLockSetting {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  lockType: LockType;
  lock_deadline?: string | null;   // ISO date string
  deadlineDays?: number | null;
  allowOverride: boolean;
  is_default: boolean;
  used_in_classes: number;         // hydrated by service (_count.gradeLocks)
  created_at: string;
  updated_at: string;
}

// ── Class lock (returned by getClassLocks / getClassLocksBySchoolYear) ────────

export interface GradeLockSubject {
  id: string;
  name: string;
}

export interface GradeLockClass {
  id: string;
  subject_id: string;
  educator_id: string;
  school_year_id: string;
  subject: {
    program?: GradeLockSubject | null;
    course?: GradeLockSubject | null;
    strand?: GradeLockSubject | null;
    level?: GradeLockSubject | null;
  } | null;
}

export interface GradeLockSettingSlim {
  id: string;
  name: string;
  lockType: LockType;
  allowOverride: boolean;
}

export interface GradeLock {
  id: string;
  org_id: string;
  class_id: string;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  lockStatus: LockStatus;
  deadline: string | null;         // ISO date string, resolved by service
  setting: GradeLockSettingSlim | null;
  className: string;               // subject name, hydrated by service
  educatorName: string;            // full_name from profile, hydrated by service
  class: GradeLockClass;
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface GradeLockEvent {
  id: string;
  org_id: string;
  class_id: string;
  actor_id: string;
  type: 'lock' | 'unlock' | 'override' | 'request';
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

// ── DTOs (client → API) ───────────────────────────────────────────────────────

export interface CreateGradeLockSettingDto {
  name: string;
  description?: string;
  lockType: LockType;
  lock_deadline?: string;   // ISO date string
  deadlineDays?: number;
  allowOverride: boolean;
  is_default?: boolean;
}

export interface UpdateGradeLockSettingDto {
  name?: string;
  description?: string;
  lockType?: LockType;
  lock_deadline?: string;
  deadlineDays?: number;
  allowOverride?: boolean;
  is_default?: boolean;
}

export interface AssignSettingDto {
  class_id: string;
  setting_id: string;
}

export interface LockClassDto {
  reason?: string;
}

export interface UnlockClassDto {
  reason: string;
}

export interface OverrideGradeLockDto {
  reason: string;
}

export interface QueryGradeLockDto {
  schoolYearId?: string;
  semesterId?: string;
}
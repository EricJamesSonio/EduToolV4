export type GradeLockStatus = "unlocked" | "locked" | "auto_locked";

export interface GradeLockSetting {
  id: string;
  classId: string;
  termId: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeLock {
  id: string;
  classId: string;
  className: string;
  educatorId: string;
  educatorName: string;
  semesterName: string;
  termName: string;
  lockStatus: GradeLockStatus;
  deadline: string | null;
  lockedAt: string | null;
}

export interface GradeLockOverride {
  classId: string;
  termId: string;
  reason: string;
}
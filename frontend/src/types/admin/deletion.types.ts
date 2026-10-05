// frontend/src/types/admin/deletion.types.ts
//
// Shared types for the safe-delete flow used by every deletable entity
// (department/program, school year, subject, educator).
// Mirrors `backend/src/commons/utils/deletion-report.util.ts`.

export interface DeletionImpactItem {
  key: string;
  label: string;
  count: number;
}

export interface DeletionCheck {
  canDelete: boolean;
  blockers: DeletionImpactItem[];
  willDelete: DeletionImpactItem[];
  /** Subjects report which outcome applies; other entities always delete. */
  outcome?: "delete" | "archive";
}

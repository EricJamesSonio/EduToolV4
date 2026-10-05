// src/commons/utils/deletion-report.util.ts
//
// Shared helpers for the safe-delete flow used by every deletable entity
// (program/department, school year, subject, educator).
//
// Contract (same for every entity):
// - `GET /<entity>/:id/deletion-check` returns `{ canDelete, blockers, willDelete }`
//   where each entry is `{ key, label, count }`.
// - `DELETE /<entity>/:id` re-runs the same check inside the transaction and
//   throws `ConflictException` with a readable message if blocked.
//
// Only entries with `count > 0` are included — the frontend renders the arrays
// as-is, so empty groups never appear in either dialog state.

export interface DeletionImpactItem {
  key: string;
  label: string;
  count: number;
}

export interface DeletionReport {
  canDelete: boolean;
  blockers: DeletionImpactItem[];
  willDelete: DeletionImpactItem[];
}

/** Build one report entry. Returns `null` when there is nothing to report. */
export function item(
  key: string,
  label: string,
  count: number,
): DeletionImpactItem | null {
  if (!count || count <= 0) return null;
  return { key, label, count };
}

/** Assemble the report, dropping `null`/zero entries on both sides. */
export function buildDeletionReport(
  blockers: Array<DeletionImpactItem | null>,
  willDelete: Array<DeletionImpactItem | null>,
): DeletionReport {
  const presentBlockers = blockers.filter(
    (entry): entry is DeletionImpactItem => entry !== null,
  );
  const presentWillDelete = willDelete.filter(
    (entry): entry is DeletionImpactItem => entry !== null,
  );
  return {
    canDelete: presentBlockers.length === 0,
    blockers: presentBlockers,
    willDelete: presentWillDelete,
  };
}

/** Readable `ConflictException` message, e.g. "Cannot delete this department — it still has 3 enrollments, 1 class." */
export function formatBlockerMessage(
  entityLabel: string,
  blockers: DeletionImpactItem[],
): string {
  const parts = blockers.map((blocker) => `${blocker.count} ${blocker.label}`);
  return `Cannot delete this ${entityLabel} \u2014 it still has ${parts.join(', ')}.`;
}

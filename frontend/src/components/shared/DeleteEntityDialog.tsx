"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { DeletionCheck } from "@/types/admin/deletion.types";

function ImpactList({ items }: { items: { label: string; count: number }[] }): React.JSX.Element {
  return (
    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-left">
      {items.map((entry) => (
        <li key={entry.label}>
          {entry.count} {entry.label}
        </li>
      ))}
    </ul>
  );
}

export interface DeleteEntityDialogCheckState {
  data?: DeletionCheck;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

interface DeleteEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Singular entity label, e.g. "department". Used in titles + messages. */
  entityLabel: string;
  /** Display name of the record, e.g. the department name. */
  entityName: string;
  /** Result of the `GET /:id/deletion-check` hook. */
  check: DeleteEntityDialogCheckState;
  /** True while the delete/archive mutation is in flight. */
  isDeleting: boolean;
  /** Runs the delete/archive mutation. Confirm button stays disabled until done. */
  onConfirmDelete: () => void;
  /** Confirm button text for the destructive state. Defaults to `Delete ${entityLabel}`. */
  confirmLabel?: string;
  /** Shown under the confirm title when records will also be removed. */
  willDeleteNote?: string;
  /** Archive-mode overrides (subjects): used when `check.data.outcome === "archive"`. */
  archiveTitle?: string;
  archiveConfirmLabel?: string;
  archiveNote?: string;
}

/**
 * Generic three-state safe-delete dialog. Every per-entity delete flow renders
 * this (thin wrappers allowed only when copy genuinely differs).
 *
 * - checking → spinner dialog, no cancel, cannot be dismissed.
 * - blocked  → info-only dialog listing blockers, no cancel button.
 * - confirm  → destructive dialog listing everything removed alongside.
 *
 * The dialog cannot be closed mid-request (`isLoading || isDeleting`).
 */
export function DeleteEntityDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName,
  check,
  isDeleting,
  onConfirmDelete,
  confirmLabel,
  willDeleteNote,
  archiveTitle,
  archiveConfirmLabel,
  archiveNote,
}: DeleteEntityDialogProps): React.JSX.Element {
  const busy = check.isLoading || isDeleting;

  const handleOpenChange = (next: boolean): void => {
    if (!next && busy) return;
    onOpenChange(next);
  };

  if (check.isLoading || (!check.data && !check.isError)) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`Checking "${entityName}"…`}
        message="Counting linked records. This only takes a moment."
        confirmLabel="Checking…"
        isLoading
        hideCancel
        onConfirm={() => {}}
      />
    );
  }

  if (check.isError || !check.data) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`Cannot check this ${entityLabel}`}
        message={check.errorMessage ?? "Failed to check linked records. Please try again."}
        confirmLabel="Close"
        hideCancel
        onConfirm={() => onOpenChange(false)}
      />
    );
  }

  const report = check.data;

  if (!report.canDelete) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={`Cannot delete this ${entityLabel}`}
        message={
          <>
            <span>
              {`"${entityName}" is still in use. Remove the following first:`}
            </span>
            <ImpactList items={report.blockers} />
          </>
        }
        confirmLabel="Understood"
        hideCancel
        onConfirm={() => onOpenChange(false)}
      />
    );
  }

  const isArchive = report.outcome === "archive";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isArchive ? (archiveTitle ?? `Archive this ${entityLabel}?`) : `Delete this ${entityLabel}?`}
      message={
        <>
          <span>
            {isArchive
              ? (archiveNote ??
                `"${entityName}" will be archived: hidden from new classes, but kept for existing records. You can restore it later.`)
              : (willDeleteNote ??
                `"${entityName}" will be permanently deleted.`)}
          </span>
          {report.willDelete.length > 0 && (
            <ImpactList items={report.willDelete} />
          )}
        </>
      }
      confirmLabel={isArchive ? (archiveConfirmLabel ?? `Archive ${entityLabel}`) : (confirmLabel ?? `Delete ${entityLabel}`)}
      destructive
      isLoading={isDeleting}
      onConfirm={onConfirmDelete}
    />
  );
}

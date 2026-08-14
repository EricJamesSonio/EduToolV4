"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Lock, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow, COMPONENT_TYPES } from "./GradingSchemeComponentRow";
import { useUpdateGradingScheme } from "@/hooks/admin/useGradingSchemes";
import { cn } from "@/lib/utils";
import type { ComponentType, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

// Local-only shape: `_touched` tracks whether the USER manually typed a weight
// for this row. Untouched rows are the ones we're allowed to auto-rebalance.
// It's stripped out before anything is sent to the API.
type EditableRow = GradingSchemeComponentDto & { _touched?: boolean };

// The 4 categories every new scheme starts with, in the order they're added.
const DEFAULT_TYPES: ComponentType[] = ["quiz", "exam", "activity", "project"];

/** Splits `total` into `n` whole-number shares that sum exactly to `total`. */
function splitEqually(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  // give the first `remainder` shares one extra point so the total is exact
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Seeds a brand-new scheme with 4 helper categories, weights split evenly to 100. */
function makeDefaultRows(): EditableRow[] {
  const weights = splitEqually(100, DEFAULT_TYPES.length);
  return DEFAULT_TYPES.map((type, i) => ({
    name:       "",
    type,
    weight:     weights[i],
    isOptional: false,
    _touched:   false,
  }));
}

/**
 * Re-splits 100% evenly across every row the user hasn't manually edited,
 * leaving any row they've typed a weight into completely alone.
 */
function rebalanceWeights(rows: EditableRow[]): EditableRow[] {
  const touchedSum = rows.reduce(
    (sum, r) => sum + (r._touched ? Number(r.weight) || 0 : 0),
    0
  );
  const untouchedCount = rows.filter((r) => !r._touched).length;
  if (untouchedCount === 0) return rows;

  const remaining = Math.max(0, 100 - touchedSum);
  const shares = splitEqually(remaining, untouchedCount);

  let shareIdx = 0;
  return rows.map((r) => {
    if (r._touched) return r;
    const weight = shares[shareIdx];
    shareIdx += 1;
    return { ...r, weight };
  });
}

export function GradingSchemeEditor() {
  const scheme = undefined as
    | { components?: GradingSchemeComponentDto[]; isLocked?: boolean }
    | undefined;
  const isLoading = false;
  const updateMutation = useUpdateGradingScheme();

  const [rows, setRows]               = useState<EditableRow[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scheme) {
      // Existing scheme: load as-is and treat every saved weight as "touched"
      // (fixed) so adding a new category later won't silently reshuffle them.
      setRows(
        (scheme.components ?? []).map((c) => ({
          name:       c.name,
          type:       c.type,
          weight:     c.weight,
          isOptional: c.isOptional,
          maxScore:   c.maxScore ?? undefined,
          _touched:   true,
        }))
      );
    } else if (!isLoading) {
      // Brand-new scheme: seed the 4 helper defaults, evenly split.
      setRows(makeDefaultRows());
    }
  }, [scheme, isLoading]);

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const isLocked    = scheme?.isLocked ?? false;
  const canSave     = !isLocked && totalWeight === 100 && rows.length > 0 && !updateMutation.isPending;

  const handleChange = (
    index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const updated: EditableRow = { ...r, [field]: value };
        // Once the user edits a weight themselves, it's off-limits to auto-rebalancing.
        if (field === "weight") updated._touched = true;
        return updated;
      })
    );
  };

  const handleAdd = () => {
    setRows((prev) => {
      const usedTypes = new Set(prev.map((r) => r.type));
      const nextType =
        COMPONENT_TYPES.find((t) => !usedTypes.has(t.value))?.value ?? "custom";

      const newRow: EditableRow = {
        name:       "",
        type:       nextType,
        weight:     0,
        isOptional: false,
        _touched:   false,
      };

      return rebalanceWeights([...prev, newRow]);
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setRows((prev) => rebalanceWeights(prev.filter((_, i) => i !== deleteIndex)));
    setDeleteIndex(null);
  };

  const handleSave = () => {
    // Strip the local-only _touched flag before sending to the API.
    const payload: GradingSchemeComponentDto[] = rows.map(({ _touched, ...rest }) => rest);

    updateMutation.mutate(
      { components: payload } as any,
      {
        onSuccess: () => toast.success("Grading scheme saved."),
        onError: (err: unknown) => {
          const axiosErr = err as AxiosError<{ message: string }>;
          toast.error(axiosErr?.response?.data?.message ?? "Failed to save grading scheme.");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lock banner */}
      {isLocked && (
        <div className="flex items-center gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="h-4 w-4 shrink-0" />
          <span className="not-interactive">
            <strong>Locked</strong> — this grading scheme is locked because enrolled students
            exist in one or more classes. Remove all enrolled students first to make changes.
          </span>
        </div>
      )}

      {/* Column headers — only when rows exist */}
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-0.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide not-interactive">Category Name</span>
          <span className="w-[140px] text-xs font-medium text-muted-foreground uppercase tracking-wide not-interactive">Type</span>
          <span className="w-[96px] text-xs font-medium text-muted-foreground uppercase tracking-wide not-interactive">Weight</span>
          <span className="w-8" />
        </div>
      )}

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <GradingSchemeComponentRow
            key={i}
            index={i}
            row={row}
            disabled={isLocked || updateMutation.isPending}
            usedTypes={rows.filter((_, j) => j !== i).map((r) => r.type)}
            onChange={handleChange}
            onDelete={(idx) => setDeleteIndex(idx)}
          />
        ))}

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground not-interactive">
              No grading scheme configured yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs not-interactive">
              Click <strong>Add Category</strong> below to define how grades are weighted for this school.
            </p>
          </div>
        )}
      </div>

      {/* Add row */}
      {!isLocked && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={updateMutation.isPending}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      )}

      {/* Total weight + save */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground not-interactive">Total:</span>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums not-interactive",
              totalWeight === 100 ? "text-green-600" : "text-destructive"
            )}
          >
            {totalWeight}% / 100%
          </span>
          {rows.length > 0 && totalWeight !== 100 && (
            <span className="text-xs text-muted-foreground not-interactive">
              (must equal 100% to save)
            </span>
          )}
        </div>

        <Button
          size="sm"
          disabled={!canSave}
          onClick={handleSave}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? "Saving..." : "Save Grading Scheme"}
        </Button>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(o) => { if (!o) setDeleteIndex(null); }}
        title="Remove this component?"
        message={
          deleteIndex !== null && rows[deleteIndex]
            ? `Remove "${rows[deleteIndex].name || "this component"}" from the scheme?`
            : "Remove this component?"
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
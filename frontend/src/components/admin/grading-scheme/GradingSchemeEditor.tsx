"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Lock, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "./GradingSchemeComponentRow";
import { useUpdateGradingScheme } from "@/hooks/admin/useGradingSchemes";
import { cn } from "@/lib/utils";
import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name:       "",
  type:       "quiz",
  weight:     0,
  isOptional: false,
});

export function GradingSchemeEditor() {
  const scheme = undefined as
    | { components?: GradingSchemeComponentDto[]; isLocked?: boolean }
    | undefined;
  const isLoading = false;
  const updateMutation = useUpdateGradingScheme();

  const [rows, setRows]               = useState<GradingSchemeComponentDto[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scheme) {
      setRows(
        (scheme.components ?? []).map((c) => ({
          name:       c.name,
          type:       c.type,
          weight:     c.weight,
          isOptional: c.isOptional,
          maxScore:   c.maxScore ?? undefined,
        }))
      );
    }
  }, [scheme]);

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const isLocked    = scheme?.isLocked ?? false;
  const canSave     = !isLocked && totalWeight === 100 && rows.length > 0 && !updateMutation.isPending;

  const handleChange = (
    index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleAdd = () => setRows((prev) => [...prev, DEFAULT_ROW()]);

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const handleSave = () => {
    updateMutation.mutate(
      { components: rows } as any,
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
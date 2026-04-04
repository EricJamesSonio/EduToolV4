"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";
import {
  useCreateGradingScheme,
  useUpdateGradingScheme,
} from "@/hooks/educator/useGradingSchemes";
import { cn } from "@/lib/utils";
import type { GradingScheme, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

interface NewTemplateDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a scheme to edit an existing template; omit for create */
  editScheme?:  GradingScheme | null;
}

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name:       "",
  type:       "quiz",
  weight:     0,
  isOptional: false,
});

export function NewTemplateDialog({
  open,
  onOpenChange,
  editScheme,
}: NewTemplateDialogProps) {
  const isEditing = !!editScheme;

  const createMutation = useCreateGradingScheme();
  const updateMutation = useUpdateGradingScheme();
  const isBusy         = createMutation.isPending || updateMutation.isPending;

  const [name, setName]               = useState("");
  const [rows, setRows]               = useState<GradingSchemeComponentDto[]>([DEFAULT_ROW()]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (open && editScheme) {
      setName(editScheme.name);
      const components = Array.isArray(editScheme.components) ? editScheme.components : [];
      setRows(
        components.length > 0
          ? components.map((c) => ({
              name:       c.name,
              type:       c.type,
              weight:     c.weight,
              isOptional: c.isOptional,
              maxScore:   c.maxScore ?? undefined,
            }))
          : [DEFAULT_ROW()]
      );
    } else if (open && !editScheme) {
      setName("");
      setRows([DEFAULT_ROW()]);
    }
  }, [open, editScheme]);

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const canSave     = !isBusy && name.trim().length >= 2 && totalWeight === 100 && rows.length > 0;

  const handleChange = (
    index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleAdd = () => setRows((prev) => [...prev, DEFAULT_ROW()]);

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const handleClose = () => {
    if (isBusy) return;
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!canSave) return;

    if (isEditing && editScheme) {
      updateMutation.mutate(
        { id: editScheme.id, data: { name: name.trim(), components: rows } },
        {
          onSuccess: () => {
            toast.success("Template updated.");
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            const axiosErr = err as AxiosError<{ message: string }>;
            toast.error(axiosErr?.response?.data?.message ?? "Failed to update template.");
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: name.trim(), components: rows },
        {
          onSuccess: () => {
            toast.success("Template saved to library.");
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            const axiosErr = err as AxiosError<{ message: string }>;
            toast.error(axiosErr?.response?.data?.message ?? "Failed to save template.");
          },
        }
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Template" : "New Grading Scheme Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Standard Semester Scheme"
                value={name}
                disabled={isBusy}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Column headers */}
            {rows.length > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-0.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Category Name
                </span>
                <span className="w-[140px] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Type
                </span>
                <span className="w-[96px] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Weight
                </span>
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
                  disabled={isBusy}
                  onChange={handleChange}
                  onDelete={(idx) => setDeleteIndex(idx)}
                />
              ))}
            </div>

            {/* Add row */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={isBusy}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>

            {/* Weight total */}
            <div className="flex items-center gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  totalWeight === 100 ? "text-green-600" : "text-destructive"
                )}
              >
                {totalWeight}% / 100%
              </span>
              {rows.length > 0 && totalWeight !== 100 && (
                <span className="text-xs text-muted-foreground">
                  (must equal 100% to save)
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={handleSave} className="gap-1.5">
              <Save className="h-4 w-4" />
              {isBusy ? "Saving..." : isEditing ? "Save Changes" : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete component confirm */}
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
    </>
  );
}
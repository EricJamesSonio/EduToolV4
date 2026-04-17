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

import type {
  GradingScheme,
  GradingSchemeComponentDto,
} from "@/types/admin/grading-scheme.types";

import type { AxiosError } from "axios";

interface GradingSchemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** editing existing class scheme */
  editScheme?: GradingScheme | null;

  /** required: class target */
  classId: string;
}

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name: "",
  type: "quiz",
  weight: 0,
  isOptional: false,
});

export function GradingSchemeDialog({
  open,
  onOpenChange,
  editScheme,
  classId,
}: GradingSchemeDialogProps) {
  const isEditing = !!editScheme;

  const createMutation = useCreateGradingScheme();
  const updateMutation = useUpdateGradingScheme();

  const isBusy =
    createMutation.isPending || updateMutation.isPending;

  const [name, setName] =
    useState("");

  const [rows, setRows] =
    useState<GradingSchemeComponentDto[]>([DEFAULT_ROW()]);

  const [deleteIndex, setDeleteIndex] =
    useState<number | null>(null);

  // RESET / HYDRATE
  useEffect(() => {
    if (open && editScheme) {
      setName(editScheme.name);

      const components = Array.isArray(editScheme.components)
        ? editScheme.components
        : [];

      setRows(
        components.length > 0
          ? components.map((c) => ({
              name: c.name,
              type: c.type,
              weight: c.weight,
              isOptional: c.isOptional,
              maxScore: c.maxScore ?? undefined,
            }))
          : [DEFAULT_ROW()]
      );
    }

    if (open && !editScheme) {
      setName("");
      setRows([DEFAULT_ROW()]);
    }
  }, [open, editScheme]);

  const totalWeight = rows.reduce(
    (sum, r) => sum + (Number(r.weight) || 0),
    0
  );

  const canSave =
    !isBusy &&
    name.trim().length >= 2 &&
    totalWeight === 100 &&
    rows.length > 0;

  const handleChange = (
    index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    );
  };

  const handleAdd = () =>
    setRows((prev) => [...prev, DEFAULT_ROW()]);

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setRows((prev) =>
      prev.filter((_, i) => i !== deleteIndex)
    );
    setDeleteIndex(null);
  };

  const handleClose = () => {
    if (isBusy) return;
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!canSave) return;

    const payload = {
      name: name.trim(),
      classId,
      components: rows,
    };

    if (isEditing && editScheme) {
      updateMutation.mutate(
        {
          id: editScheme.id,
          data: {
            name: payload.name,
            components: payload.components,
          },
        },
        {
          onSuccess: () => {
            toast.success("Grading scheme updated.");
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            const axiosErr =
              err as AxiosError<{ message: string }>;
            toast.error(
              axiosErr?.response?.data?.message ??
                "Failed to update grading scheme."
            );
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Grading scheme created.");
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const axiosErr =
            err as AxiosError<{ message: string }>;
          toast.error(
            axiosErr?.response?.data?.message ??
              "Failed to create grading scheme."
          );
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">

          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? "Edit Grading Scheme"
                : "New Grading Scheme"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">

            {/* NAME */}
            <div className="space-y-1.5">
              <Label>Scheme name</Label>
              <Input
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                disabled={isBusy}
                placeholder="e.g. 1st Semester Scheme"
              />
            </div>

            {/* HEADER */}
            {rows.length > 0 && (
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-0.5">
                <span className="text-xs uppercase text-muted-foreground">
                  Category
                </span>
                <span className="text-xs uppercase text-muted-foreground w-[140px]">
                  Type
                </span>
                <span className="text-xs uppercase text-muted-foreground w-[96px]">
                  Weight
                </span>
                <span />
              </div>
            )}

            {/* ROWS */}
            <div className="space-y-3">
              {rows.map((row, i) => (
                <GradingSchemeComponentRow
                  key={i}
                  index={i}
                  row={row}
                  disabled={isBusy}
                  onChange={handleChange}
                  onDelete={setDeleteIndex}
                />
              ))}
            </div>

            {/* ADD */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={isBusy}
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>

            {/* TOTAL */}
            <div className="flex items-center gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">
                Total:
              </span>

              <span
                className={cn(
                  "text-sm font-semibold",
                  totalWeight === 100
                    ? "text-green-600"
                    : "text-destructive"
                )}
              >
                {totalWeight}% / 100%
              </span>
            </div>

          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isBusy}
            >
              Cancel
            </Button>

            <Button
              disabled={!canSave}
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              {isBusy
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Save"}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteIndex(null);
        }}
        title="Remove component?"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
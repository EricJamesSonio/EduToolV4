"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Lock, Plus, Save, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";
import { ImportFromLibraryDialog } from "./ImportFromLibraryDialog";

import {
  useClassGradingScheme,
  useCreateGradingScheme,
  useUpdateGradingScheme,
} from "@/hooks/educator/useGradingSchemes";

import { cn } from "@/lib/utils";

import type {
  GradingSchemeComponentDto,
} from "@/types/admin/grading-scheme.types";

import type { AxiosError } from "axios";

interface ClassGradingSchemeEditorProps {
  classId: string;
}

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name: "",
  type: "written_work",
  weight: 0,
  isOptional: false,
  maxScore: null,
});

export function ClassGradingSchemeEditor({
  classId,
}: ClassGradingSchemeEditorProps) {
  const { data: scheme, isLoading } = useClassGradingScheme(classId);

  const createMutation = useCreateGradingScheme();
  const updateMutation = useUpdateGradingScheme();

  const [rows, setRows] = useState<GradingSchemeComponentDto[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    if (scheme) {
      setRows(
        (scheme.components ?? []).map((c) => ({
          name: c.name,
          type: c.type,
          weight: c.weight,
          isOptional: c.isOptional,
          maxScore: c.maxScore ?? null,
        }))
      );
    }
  }, [scheme]);

  // backend-aligned validation rule
  const totalWeight = rows
    .filter((r) => !r.isOptional)
    .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  const isLocked = scheme?.isLocked ?? false;

  const isBusy =
    createMutation.isPending || updateMutation.isPending;

  const canSave =
    !isLocked && totalWeight === 100 && rows.length > 0 && !isBusy;

  const handleChange = (
    index: number,
    field: keyof GradingSchemeComponentDto,
    value: string | number | boolean
  ) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleAdd = () =>
    setRows((prev) => [
      ...prev,
      DEFAULT_ROW(),
    ]);

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const handleImport = (
    components: GradingSchemeComponentDto[]
  ) => {
    setRows(
      components.map((c) => ({
        ...c,
        maxScore: c.maxScore ?? null,
      }))
    );

    toast.info("Imported scheme. Save to apply.");
  };

  const handleError = (err: unknown) => {
    const axiosErr = err as AxiosError<{ message: string }>;
    toast.error(
      axiosErr?.response?.data?.message ||
        "Something went wrong."
    );
  };

  // ================= SAVE =================
  const handleSave = () => {
    if (!rows.length) return;

    const payload = {
      name: scheme?.name ?? "Class Grading Scheme",
      classId,
      components: rows,
    };

    if (scheme) {
      updateMutation.mutate(
        {
          id: scheme.id,
          data: {
            name: payload.name,
            components: payload.components,
          },
        },
        {
          onSuccess: () =>
            toast.success("Grading scheme updated."),
          onError: handleError,
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () =>
          toast.success("Grading scheme created."),
        onError: handleError,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* LOCK */}
      {isLocked && (
        <div className="flex items-center gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Lock className="h-4 w-4" />
          <span>
            <strong>Locked</strong> — cannot edit this scheme.
          </span>
        </div>
      )}

      {/* ACTIONS */}
      {!isLocked && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLibrary(true)}
            disabled={isBusy}
          >
            <Library className="h-4 w-4" />
            Import from Library
          </Button>
        </div>
      )}

      {/* ROWS */}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <GradingSchemeComponentRow
            key={i}
            index={i}
            row={row}
            disabled={isLocked || isBusy}
            onChange={handleChange}
            onDelete={setDeleteIndex}
          />
        ))}
      </div>

      {/* ADD */}
      {!isLocked && (
        <Button onClick={handleAdd} size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      )}

      {/* FOOTER */}
      <div className="flex justify-between border-t pt-4">
        <span
          className={cn(
            totalWeight === 100
              ? "text-green-600"
              : "text-destructive"
          )}
        >
          {totalWeight}% / 100%
        </span>

        <Button disabled={!canSave} onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      {/* DELETE */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={() => setDeleteIndex(null)}
        title="Remove component?"
        onConfirm={handleDeleteConfirm}
      />

      {/* IMPORT */}
      <ImportFromLibraryDialog
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onImport={handleImport}
      />
    </div>
  );
}
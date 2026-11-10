"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Lock, Info, Plus, Save, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow, labelForType } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";
import { ImportFromLibraryDialog } from "./ImportFromLibraryDialog";

import {
  useClassGradingScheme,
  useClassGradingSchemeStatus,
  useCreateGradingScheme,
  useUpdateGradingScheme,
} from "@/hooks/educator/useGradingSchemes";

import { cn } from "@/lib/utils";

import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

interface ClassGradingSchemeEditorProps {
  classId: string;
}

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name: labelForType("written_work"),
  type: "written_work",
  weight: 0,
  isOptional: false,
  maxScore: null,
});

export function ClassGradingSchemeEditor({
  classId,
}: ClassGradingSchemeEditorProps) {
  // ================= DATA =================
  const { data: scheme, isLoading } = useClassGradingScheme(classId);
  const { data: status } = useClassGradingSchemeStatus(classId);

  const createMutation = useCreateGradingScheme();
  const updateMutation = useUpdateGradingScheme();

  // ================= STATE =================
  const [rows, setRows] = useState<GradingSchemeComponentDto[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  // ================= SAFE COMPONENTS =================
  const components = useMemo(() => {
    return scheme?.components ?? [];
  }, [scheme]);

  // ================= SYNC FROM BACKEND (CRASH SAFE) =================
  useEffect(() => {
    if (!scheme) return;

    setRows(
      (scheme.components ?? []).map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        isOptional: c.isOptional,
        maxScore: c.maxScore ?? undefined,
      }))
    );
  }, [scheme]);

  // ================= TOTAL WEIGHT =================
  const totalWeight = useMemo(() => {
    return components
      .filter((r) => !r.isOptional)
      .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  }, [components]);

  // NOTE: UI should reflect current editable rows, not stale backend
  const currentTotalWeight = useMemo(() => {
    return rows
      .filter((r) => !r.isOptional)
      .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  }, [rows]);

  // ================= FLAGS =================
  // The scheme is read-only when the admin does not allow educators to
  // override it, or once the class's semester has started. The server
  // enforces both; this only mirrors it so the UI explains why.
  const isBusy =
    createMutation.isPending || updateMutation.isPending;

  const isLocked = !!status && !status.canEdit;
  const readOnly = isBusy || isLocked;

  const canSave =
    currentTotalWeight === 100 &&
    rows.length > 0 &&
    !readOnly;

  const lockMessage = useMemo(() => {
    if (!status || status.canEdit) return null;
    if (status.lockReason === "educator_override_disabled") {
      return "Your school does not allow educators to change class grading schemes. Please ask an administrator if a change is needed.";
    }
    const semester = status.semesterName ?? "the semester";
    return `This grading scheme is locked because ${semester} has already started. It stays fixed until the semester ends and can be changed for the next semester.`;
  }, [status]);

  // ================= HANDLERS =================
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

  const handleAdd = () => {
    setRows((prev) => [...prev, DEFAULT_ROW()]);
  };

  const handleDeleteConfirm = () => {
    if (deleteIndex === null) return;

    setRows((prev) =>
      prev.filter((_, i) => i !== deleteIndex)
    );
    setDeleteIndex(null);
  };

  const handleImport = (
    components: GradingSchemeComponentDto[]
  ) => {
    setRows(
      components.map((c) => ({
        ...c,
        maxScore: c.maxScore ?? undefined,
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

  // ================= SAVE (FIXED PAYLOAD) =================
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

  // ================= LOADING =================
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

  // ================= UI =================
  return (
    <div className="w-full space-y-6">
      {/* LOCKED — admin setting or semester already started */}
      {lockMessage && (
        <div className="flex items-center gap-2.5 rounded-md border border-[#FCD34D] bg-[#FDE68A] text-[#0B1E3A] px-4 py-2.5 text-sm border">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{lockMessage}</span>
        </div>
      )}

      {/* INFO — edits recalculate unlocked grades */}
      {scheme && !isLocked && (
        <div className="flex items-center gap-2.5 rounded-md border border-[#60A5FA] bg-[#93C5FD] text-[#0B1E3A] px-4 py-2.5 text-sm border">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Saving recalculates unlocked grades. Removing a category already
            used by assessments is blocked. The scheme locks when the semester
            starts.
          </span>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-5">
        {/* ACTIONS */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLibrary(true)}
            disabled={readOnly}
          >
            <Library className="h-4 w-4" />
            Import from Library
          </Button>
        </div>

        {/* ROWS */}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <GradingSchemeComponentRow
              key={i}
              index={i}
              row={row}
              disabled={readOnly}
              usedTypes={rows.filter((_, j) => j !== i).map((r) => r.type)}
              onChange={handleChange}
              onDelete={setDeleteIndex}
            />
          ))}
        </div>

        {/* ADD */}
        <Button
          onClick={handleAdd}
          size="sm"
          disabled={readOnly}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>

        {/* FOOTER */}
        <div className="flex justify-between items-center border-t pt-4">
          <span
            className={cn(
              "text-sm font-medium",
              currentTotalWeight === 100
                ? "text-success"
                : "text-destructive"
            )}
          >
            {currentTotalWeight}% / 100%
          </span>

          <Button disabled={!canSave} onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* DELETE */}
      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={() => setDeleteIndex(null)}
        title="Remove component?"
        message="Are you sure you want to remove this grading component?"
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
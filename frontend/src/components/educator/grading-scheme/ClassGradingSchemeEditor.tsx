"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Lock, Plus, Save, RotateCcw, Library, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";
import { ImportFromLibraryDialog } from "@/components/educator/grading-scheme/ImportFromLibraryDialog";
import {
  useClassGradingScheme,
  useDefaultGradingScheme,
  useSaveClassGradingScheme,
  useCreateGradingScheme,
} from "@/hooks/educator/useGradingSchemes";
import { cn } from "@/lib/utils";
import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import type { AxiosError } from "axios";

interface ClassGradingSchemeEditorProps {
  classId: string;
}

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name:       "",
  type:       "quiz",
  weight:     0,
  isOptional: false,
});

export function ClassGradingSchemeEditor({ classId }: ClassGradingSchemeEditorProps) {
  const { data: scheme, isLoading }       = useClassGradingScheme(classId);
  const { data: defaultScheme }           = useDefaultGradingScheme();
  const saveMutation                      = useSaveClassGradingScheme(classId);
  const createTemplateMutation            = useCreateGradingScheme();

  const [rows, setRows]                         = useState<GradingSchemeComponentDto[]>([]);
  const [deleteIndex, setDeleteIndex]           = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLibrary, setShowLibrary]           = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName]         = useState("");

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
  const isBusy      = saveMutation.isPending || createTemplateMutation.isPending;
  const canSave     = !isLocked && totalWeight === 100 && rows.length > 0 && !isBusy;

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

  // Use Admin Default — reset rows to org default components
  const handleResetToDefault = () => {
    if (!defaultScheme) return;
    setRows(
      defaultScheme.components.map((c) => ({
        name:       c.name,
        type:       c.type,
        weight:     c.weight,
        isOptional: c.isOptional,
        maxScore:   c.maxScore ?? undefined,
      }))
    );
    setShowResetConfirm(false);
    toast.info("Reset to admin default. Save to apply.");
  };

  // Import from Library — receives components from the picker
  const handleImport = (components: GradingSchemeComponentDto[], schemeName: string) => {
    setRows(components);
    toast.info(`Imported "${schemeName}". Save to apply.`);
  };

  // Save as New Template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    createTemplateMutation.mutate(
      { name: templateName.trim(), components: rows },
      {
        onSuccess: () => {
          toast.success(`"${templateName.trim()}" saved to your library.`);
          setShowSaveTemplate(false);
          setTemplateName("");
        },
        onError: (err: unknown) => {
          const axiosErr = err as AxiosError<{ message: string }>;
          toast.error(axiosErr?.response?.data?.message ?? "Failed to save template.");
        },
      }
    );
  };

  // Save class-scoped scheme
  const handleSave = () => {
    saveMutation.mutate(
      { components: rows },
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
          <span>
            <strong>Locked</strong> — this grading scheme is locked because students are
            enrolled in this class. Remove all enrolled students to make changes.
          </span>
        </div>
      )}

      {/* Action buttons */}
      {!isLocked && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowResetConfirm(true)}
            disabled={isBusy || !defaultScheme}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Use Admin Default
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLibrary(true)}
            disabled={isBusy}
            className="gap-1.5"
          >
            <Library className="h-4 w-4" />
            Import from Library
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTemplateName("");
              setShowSaveTemplate(true);
            }}
            disabled={isBusy || totalWeight !== 100 || rows.length === 0}
            className="gap-1.5"
          >
            <BookMarked className="h-4 w-4" />
            Save as New Template
          </Button>
        </div>
      )}

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
            disabled={isLocked || isBusy}
            onChange={handleChange}
            onDelete={(idx) => setDeleteIndex(idx)}
          />
        ))}
        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              No grading scheme configured yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Use <strong>Use Admin Default</strong>, <strong>Import from Library</strong>,
              or click <strong>Add Category</strong> to get started.
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
          disabled={isBusy}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      )}

      {/* Total weight + save */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
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
            <span className="text-xs text-muted-foreground">(must equal 100% to save)</span>
          )}
        </div>
        <Button size="sm" disabled={!canSave} onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Saving..." : "Save Grading Scheme"}
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

      {/* Reset to admin default confirm */}
      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Reset to admin default?"
        message="This will replace the current components with the organisation's default grading scheme. You'll need to save for it to take effect."
        confirmLabel="Reset"
        destructive
        onConfirm={handleResetToDefault}
      />

      {/* Import from Library */}
      <ImportFromLibraryDialog
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onImport={handleImport}
      />

      {/* Save as New Template dialog */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Save as New Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Standard Semester Scheme"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTemplate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
            <Button
              disabled={!templateName.trim() || createTemplateMutation.isPending}
              onClick={handleSaveTemplate}
            >
              {createTemplateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
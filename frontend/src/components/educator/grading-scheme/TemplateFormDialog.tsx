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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";

import {
  useCreateTemplate,
  useUpdateTemplate,
} from "@/hooks/educator/useGradingSchemeTemplates";

import { cn } from "@/lib/utils";

import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

import type { AxiosError } from "axios";

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: GradingSchemeTemplate | null;
}

const PROGRAM_TYPES = [
  { value: "college", label: "College" },
  { value: "shs", label: "Senior High School" },
  { value: "jhs", label: "Junior High School" },
  { value: "elementary", label: "Elementary" },
];

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name: "",
  type: "quiz",
  weight: 0,
  isOptional: false,
});

export function TemplateFormDialog({
  open,
  onOpenChange,
  editTemplate,
}: TemplateFormDialogProps) {
  const isEditing = !!editTemplate;

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const isBusy = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState("");
  const [programType, setProgramType] = useState<string>("");
  const [rows, setRows] = useState<GradingSchemeComponentDto[]>([
    DEFAULT_ROW(),
  ]);

  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && editTemplate) {
      setName(editTemplate.name);
      setProgramType(editTemplate.programType ?? "");

      const components = Array.isArray(editTemplate.components)
        ? editTemplate.components
        : [];

      setRows(
        components.length > 0
          ? components.map((c) => ({
              name: c.name,
              type: c.type,
              weight: c.weight,
              maxScore: c.maxScore ?? undefined,
              isOptional: false,
            }))
          : [DEFAULT_ROW()]
      );
    }

    if (open && !editTemplate) {
      setName("");
      setProgramType("");
      setRows([DEFAULT_ROW()]);
    }
  }, [open, editTemplate]);

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
      programType: programType || undefined,
      components: rows.map((r) => ({
        name: r.name,
        type: r.type,
        weight: r.weight,
        maxScore: r.maxScore ?? null,
      })),
    };

    if (isEditing && editTemplate) {
      updateMutation.mutate(
        {
          templateId: editTemplate.id,
          data: payload,
        },
        {
          onSuccess: () => {
            toast.success("Template updated.");
            onOpenChange(false);
          },
          onError: (err: unknown) => {
            const axiosErr = err as AxiosError<{ message: string }>;
            toast.error(
              axiosErr?.response?.data?.message ??
                "Failed to update template."
            );
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created.");
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const axiosErr = err as AxiosError<{ message: string }>;
          toast.error(
            axiosErr?.response?.data?.message ??
              "Failed to create template."
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
              {isEditing ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Template name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isBusy}
                placeholder="e.g. Standard Semester Scheme"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Program type (optional)</Label>
              <Select
                value={programType}
                onValueChange={(value) => setProgramType(value ?? "")}
                disabled={isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All programs" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex items-center gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">
                Total:
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
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

            <Button disabled={!canSave} onClick={handleSave}>
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

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteIndex(null);
        }}
        title="Remove component?"
        message={
          deleteIndex !== null && rows[deleteIndex]
            ? `Remove "${rows[deleteIndex].name}"?`
            : "Remove component?"
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

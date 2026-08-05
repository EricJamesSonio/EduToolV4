"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Save, AlertCircle } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GradingSchemeComponentRow } from "@/components/admin/grading-scheme/GradingSchemeComponentRow";
import { cn } from "@/lib/utils";

import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
} from "@/types/admin/grading-scheme-template.types";
import type { GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";
import {
  PROGRAM_TYPE_VALUES,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from "@/types/admin/program.types";

const PROGRAM_TYPES = PROGRAM_TYPE_VALUES.map((value) => ({
  value,
  label: PROGRAM_TYPE_LABELS[value as ProgramType],
}));

const DEFAULT_ROW = (): GradingSchemeComponentDto => ({
  name: "",
  type: "quiz",
  weight: 0,
  isOptional: false,
});

interface SharedTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: GradingSchemeTemplate | null;
  onSave: (dto: CreateGradingSchemeTemplateDto) => void;
  isSaving: boolean;
  showProgramType?: boolean;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSave,
  isSaving,
  showProgramType = false,
}: SharedTemplateFormDialogProps) {
  const isEditing = !!template;

  const [name, setName] = useState("");
  const [programType, setProgramType] = useState<string>("");
  const [rows, setRows] = useState<GradingSchemeComponentDto[]>([DEFAULT_ROW()]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setProgramType(template.programType ?? "");
        const components = Array.isArray(template.components) ? template.components : [];
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
      } else {
        setName("");
        setProgramType("");
        setRows([DEFAULT_ROW()]);
      }
    }
  }, [open, template]);

  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const canSave =
    !isSaving &&
    name.trim().length >= 2 &&
    totalWeight === 100 &&
    rows.length > 0;

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
    if (isSaving) return;
    onOpenChange(false);
  };

  const COMPONENT_TYPE_LABELS: Record<string, string> = {
    written_work: "Written Work",
    performance_task: "Performance Task",
    quarterly_assessment: "Quarterly Assessment",
    exam: "Exam",
    quiz: "Quiz",
    assignment: "Assignment",
    project: "Project",
    recitation: "Recitation",
    participation: "Participation",
    behavior: "Behavior",
    attendance: "Attendance",
    activity: "Activity",
    custom: "Custom",
    other: "Other",
  };

  const handleSave = () => {
    if (!canSave) return;

    onSave({
      name: name.trim(),
      ...(showProgramType && programType ? { programType } : {}),
      components: rows.map((r) => ({
        name: r.name.trim() || COMPONENT_TYPE_LABELS[r.type] || r.type,
        type: r.type,
        weight: r.weight,
        maxScore: r.maxScore ?? null,
      })),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                disabled={isSaving}
                placeholder='e.g. "Standard Semester Scheme"'
              />
            </div>

            {showProgramType && (
              <div className="space-y-1.5">
                <Label>Program type (optional)</Label>
                <Select
                  value={programType}
                  onValueChange={(value) => setProgramType(value ?? "")}
                  disabled={isSaving}
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
            )}

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
                  disabled={isSaving}
                  onChange={handleChange}
                  onDelete={setDeleteIndex}
                />
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={isSaving}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>

            <div className="flex items-center gap-2 border-t pt-3">
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      totalWeight > 100
                        ? "bg-destructive"
                        : totalWeight === 100
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    )}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    totalWeight === 100 ? "text-green-600" : "text-destructive"
                  )}
                >
                  {totalWeight}% / 100%
                </span>
                {totalWeight !== 100 && (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button disabled={!canSave} onClick={handleSave}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(o) => { if (!o) setDeleteIndex(null); }}
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

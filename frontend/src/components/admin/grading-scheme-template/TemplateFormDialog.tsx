"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, GripVertical, AlertCircle } from "lucide-react";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateGradingSchemeTemplate,
  useUpdateGradingSchemeTemplate,
} from "@/hooks/admin/useGradingSchemeTemplates";
import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
} from "@/types/admin/grading-scheme-template.types";
import type { ComponentType } from "@/types/admin/grading-scheme.types";

const COMPONENT_TYPES: { value: ComponentType; label: string; color: string }[] = [
  { value: "written_work",         label: "Written Work",          color: "bg-blue-100 text-blue-700" },
  { value: "performance_task",     label: "Performance Task",      color: "bg-violet-100 text-violet-700" },
  { value: "quarterly_assessment", label: "Quarterly Assessment",  color: "bg-amber-100 text-amber-700" },
  { value: "exam",                 label: "Exam",                  color: "bg-red-100 text-red-700" },
  { value: "quiz",                 label: "Quiz",                  color: "bg-orange-100 text-orange-700" },
  { value: "project",              label: "Project",               color: "bg-green-100 text-green-700" },
  { value: "recitation",           label: "Recitation",            color: "bg-cyan-100 text-cyan-700" },
  { value: "attendance",           label: "Attendance",            color: "bg-teal-100 text-teal-700" },
  { value: "other",                label: "Other",                 color: "bg-gray-100 text-gray-700" },
];

const TYPE_COLOR_MAP = Object.fromEntries(
  COMPONENT_TYPES.map((t) => [t.value, t.color])
);

interface LocalComponent {
  name: string;
  type: ComponentType;
  weight: number;
  maxScore?: number | null;
}

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: GradingSchemeTemplate;
}

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

const defaultComponents = (): LocalComponent[] => [
  { name: "Written Work",         type: "written_work",         weight: 30 },
  { name: "Performance Task",     type: "performance_task",     weight: 50 },
  { name: "Quarterly Assessment", type: "quarterly_assessment", weight: 20 },
];

export function TemplateFormDialog({
  open,
  onClose,
  template,
}: TemplateFormDialogProps): React.JSX.Element {
  const isEdit = !!template;
  const createMutation = useCreateGradingSchemeTemplate();
  const updateMutation = useUpdateGradingSchemeTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(template?.name ?? "");
  const [components, setComponents] = useState<LocalComponent[]>(() =>
    template?.components?.length
      ? template.components.map((c) => ({
          name: c.name,
          type: c.type,
          weight: c.weight,
          maxScore: c.maxScore,
        }))
      : defaultComponents()
  );

  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setComponents(
        template?.components?.length
          ? template.components.map((c) => ({
              name: c.name,
              type: c.type,
              weight: c.weight,
              maxScore: c.maxScore,
            }))
          : defaultComponents()
      );
    }
  }, [open, template]);

  const totalWeight = components.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isValid = totalWeight === 100;

const addComponent = () =>
  setComponents((prev) => [
    ...prev,
    { name: "", type: "other", weight: 0 },
  ]);

  const removeComponent = (i: number) =>
    setComponents((prev) => prev.filter((_, idx) => idx !== i));

  const updateComponent = (
    i: number,
    field: keyof LocalComponent,
    value: string | number | null
  ) =>
    setComponents((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    );

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Template name is required.");
    if (components.length === 0) return toast.error("Add at least one component.");
    if (!isValid) return toast.error(`Weights must total 100%. Currently: ${totalWeight}%`);
    for (const c of components) {
      if (!c.name.trim()) return toast.error("All components need a name.");
    }

    const dto: CreateGradingSchemeTemplateDto = {
      name: name.trim(),
      components: components.map((c) => ({
        name: c.name.trim(),
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore ?? null,
      })),
    };

    if (isEdit) {
      updateMutation.mutate(
        { templateId: template.id, data: dto },
        {
          onSuccess: () => { toast.success("Template updated."); onClose(); },
          onError: (e) => toast.error(errMsg(e)),
        }
      );
    } else {
      createMutation.mutate(dto, {
        onSuccess: () => { toast.success("Grading scheme template created."); onClose(); },
        onError: (e) => toast.error(errMsg(e)),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl w-full" style={{ maxWidth: "56rem" }}>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {isEdit ? "Edit Grading Scheme Template" : "New Grading Scheme Template"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Define reusable grading components and their weights. Total must equal 100%.
          </DialogDescription>
        </DialogHeader>

        {/* Template Name */}
        <div className="space-y-1.5">
          <Label className="text-sm">Template Name</Label>
          <Input
            placeholder='e.g. "Standard College Scheme"'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Components section */}
        <div className="space-y-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Components</Label>

              {/* Weight progress bar + badge */}
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      totalWeight > 100
                        ? "bg-destructive"
                        : totalWeight === 100
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(totalWeight, 100)}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    totalWeight > 100
                      ? "text-destructive"
                      : totalWeight === 100
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {totalWeight}%
                </span>
                {!isValid && (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addComponent}
              className="h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Component
            </Button>
          </div>

          {/* Column headers */}
          {components.length > 0 && (
            <div className="grid grid-cols-[1fr_180px_100px_100px_36px] gap-2 px-1">
              <span className="text-xs text-muted-foreground font-medium">Name</span>
              <span className="text-xs text-muted-foreground font-medium">Type</span>
              <span className="text-xs text-muted-foreground font-medium">Weight %</span>
              <span className="text-xs text-muted-foreground font-medium">Max Score</span>
              <span />
            </div>
          )}

          {/* Empty state */}
          {components.length === 0 && (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No components yet —{" "}
                <button
                  type="button"
                  className="text-primary underline underline-offset-2"
                  onClick={addComponent}
                >
                  add one
                </button>
                .
              </p>
            </div>
          )}

          {/* Component rows */}
          <div className="space-y-2">
            {components.map((comp, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_180px_100px_100px_36px] gap-2 items-center group"
              >
                {/* Name */}
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. Written Work"
                  value={comp.name}
                  onChange={(e) => updateComponent(i, "name", e.target.value)}
                />

                {/* Type */}
                <Select
                  value={comp.type}
                  onValueChange={(v) =>
                    updateComponent(i, "type", v as ComponentType)
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPONENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${t.color}`}>
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Weight */}
                <div className="relative">
                  <Input
                    className="h-9 text-sm pr-6"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={comp.weight || ""}
                    onChange={(e) =>
                      updateComponent(i, "weight", parseFloat(e.target.value) || 0)
                    }
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>

                {/* Max Score */}
                <Input
                  className="h-9 text-sm"
                  type="number"
                  min={0}
                  placeholder="—"
                  value={comp.maxScore ?? ""}
                  onChange={(e) =>
                    updateComponent(
                      i,
                      "maxScore",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                />

                {/* Remove */}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                  onClick={() => removeComponent(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Weight summary chips */}
          {components.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {components.map((c, i) => {
                const colorClass = TYPE_COLOR_MAP[c.type] ?? "bg-gray-100 text-gray-700";
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
                  >
                    {c.name || "—"}
                    <span className="opacity-60">·</span>
                    {c.weight}%
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending
              ? "Saving…"
              : isEdit
              ? "Save Changes"
              : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
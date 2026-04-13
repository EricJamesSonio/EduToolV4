"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
  { value: "written_work", label: "Written Work" },
  { value: "performance_task", label: "Performance Task" },
  { value: "quarterly_assessment", label: "Quarterly Assessment" },
  { value: "exam", label: "Exam" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Project" },
  { value: "recitation", label: "Recitation" },
  { value: "attendance", label: "Attendance" },
  { value: "other", label: "Other" },
];

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
  { name: "Written Work", type: "written_work", weight: 30 },
  { name: "Performance Task", type: "performance_task", weight: 50 },
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
    if (components.length === 0)
      return toast.error("Add at least one component.");
    if (totalWeight !== 100)
      return toast.error(`Weights must total 100%. Currently: ${totalWeight}%`);
    for (const c of components) {
      if (!c.name.trim()) return toast.error("All components need a name.");
      if (!c.type) return toast.error("All components need a type.");
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Grading Scheme Template" : "New Grading Scheme Template"}
          </DialogTitle>
          <DialogDescription>
            Define reusable grading components with weights. Total weight must equal 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder='e.g. "Standard College Scheme"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Components</Label>
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    totalWeight === 100
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {totalWeight}% / 100%
                </span>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addComponent}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Component
              </Button>
            </div>

            {components.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No components yet — click &quot;Add Component&quot; to start.
              </div>
            )}

            <div className="space-y-2">
              {/* Header row */}
              {components.length > 0 && (
                <div className="grid grid-cols-[1fr_160px_80px_80px_32px] gap-2 px-1">
                  <span className="text-xs text-muted-foreground">Name</span>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <span className="text-xs text-muted-foreground">Weight %</span>
                  <span className="text-xs text-muted-foreground">Max Score</span>
                  <span />
                </div>
              )}

              {components.map((comp, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_160px_80px_80px_32px] gap-2 items-center"
                >
                  <Input
                    className="h-8 text-sm"
                    placeholder="Component name"
                    value={comp.name}
                    onChange={(e) => updateComponent(i, "name", e.target.value)}
                  />
                  <Select
                    value={comp.type}
                    onValueChange={(v) => updateComponent(i, "type", v as ComponentType)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={comp.weight || ""}
                    onChange={(e) =>
                      updateComponent(i, "weight", parseFloat(e.target.value) || 0)
                    }
                  />
                  <Input
                    className="h-8 text-sm"
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
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeComponent(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
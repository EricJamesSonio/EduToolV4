"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateGradingSchemeTemplate, useUpdateGradingSchemeTemplate } from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  template?: GradingSchemeTemplate;
}

type ComponentType = "quiz" | "activity" | "exam" | "custom" | "manual";

interface ComponentRow {
  name: string;
  type: ComponentType;
  weight: number;
  maxScore?: number;
}

const COMPONENT_TYPES: ComponentType[] = ["quiz", "activity", "exam", "custom", "manual"];

export function TemplateFormDialog({ open, onClose, template }: TemplateFormDialogProps) {
  const isEdit = !!template;
  const createMutation = useCreateGradingSchemeTemplate();
  const updateMutation = useUpdateGradingSchemeTemplate();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState("");
  const [components, setComponents] = useState<ComponentRow[]>([]);

  useEffect(() => {
    if (open) {
      if (isEdit && template) {
        setName(template.name);
        setComponents(
          template.components?.map((c) => ({
            name: c.name,
            type: c.type as ComponentType,
            weight: c.weight,
            maxScore: c.maxScore ?? undefined,
          })) ?? []
        );
      } else {
        setName("");
        setComponents([]);
      }
    }
  }, [open, template, isEdit]);

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const canSave = name.trim().length > 0 && totalWeight === 100 && components.length > 0 && !isPending;

  const addComponent = () => {
    setComponents((prev) => [
      ...prev,
      { name: "", type: "quiz", weight: 0 },
    ]);
  };

  const removeComponent = (idx: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateComponent = <K extends keyof ComponentRow>(idx: number, field: K, value: ComponentRow[K]) => {
    setComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = () => {
    if (!canSave) return;

    const payload = {
      name: name.trim(),
      components: components.map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore,
      })),
    };

    if (isEdit) {
      updateMutation.mutate(
        { templateId: template!.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Template updated.");
            onClose();
          },
          onError: (e: unknown) => {
            const err = e as AxiosError<{ message: string }>;
            toast.error(err?.response?.data?.message ?? "Failed to update.");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created.");
          onClose();
        },
        onError: (e: unknown) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to create.");
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Template" : "New Grading Scheme Template"}</DialogTitle>
          <DialogDescription>
            Define component categories and their weights. Total weight must equal 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder='e.g. "Standard Grading"'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Components */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Components</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addComponent}
                disabled={isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Component
              </Button>
            </div>

            {components.length === 0 && (
              <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No components yet — click &quot;Add Component&quot; to start.
              </div>
            )}

            {/* Column headers */}
            {components.length > 0 && (
              <div className="grid grid-cols-[1fr_140px_100px_80px_32px] gap-2 px-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Name</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Type</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Weight %</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase">Max Score</span>
                <span />
              </div>
            )}

            {/* Component rows */}
            <div className="space-y-2">
              {components.map((comp, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_140px_100px_80px_32px] gap-2 items-start">
                  <Input
                    placeholder="e.g. Quizzes"
                    value={comp.name}
                    onChange={(e) => updateComponent(idx, "name", e.target.value)}
                    className="h-8 text-sm"
                    disabled={isPending}
                  />

                  <Select
                    value={comp.type}
                    onValueChange={(v) => updateComponent(idx, "type", v as ComponentType)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="0"
                    value={comp.weight}
                    onChange={(e) => updateComponent(idx, "weight", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    disabled={isPending}
                  />

                  <Input
                    type="number"
                    placeholder="100"
                    value={comp.maxScore ?? ""}
                    onChange={(e) => updateComponent(idx, "maxScore", e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-8 text-sm"
                    disabled={isPending}
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeComponent(idx)}
                    disabled={isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Total weight */}
          {components.length > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
              <span className="text-sm font-medium">Total:</span>
              <span className={cn(
                "text-sm font-semibold",
                totalWeight === 100 ? "text-green-600" : "text-destructive"
              )}>
                {totalWeight}% / 100%
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
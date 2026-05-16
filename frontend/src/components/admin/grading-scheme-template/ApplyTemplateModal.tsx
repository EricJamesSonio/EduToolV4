// ===== File: frontend/src/components/admin/grading-scheme-template/ApplyTemplateModal.tsx =====
"use client";

import { Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

interface ApplyTemplateModalProps {
  open: boolean;
  applyTarget: {
    classId: string;
    className: string;
  } | null;
  selectedTemplateId: string;
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
  onTemplateChange: (templateId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ApplyTemplateModal({
  open,
  applyTarget,
  selectedTemplateId,
  templates,
  isLoading,
  onTemplateChange,
  onConfirm,
  onCancel,
}: ApplyTemplateModalProps): React.JSX.Element | null {
  if (!open || !applyTarget) return null;

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4 shadow-lg">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Apply Template to Class
        </h2>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            Class
          </p>
          <p className="text-base font-medium text-foreground">
            {applyTarget.className}
          </p>
        </div>

        {/* Template selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Template</label>
          <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-2">
                    <span>{t.name}</span>
                    {t.program_type && (
                      <span className="text-xs text-muted-foreground">
                        ({t.program_type})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template details */}
        {selectedTemplate && (
          <div className="rounded-md bg-muted/50 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Template Details
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Components:</span>{" "}
                <span className="text-muted-foreground">
                  {selectedTemplate.components?.length ?? 0}
                </span>
              </p>
              {selectedTemplate.program_type && (
                <p className="text-sm">
                  <span className="font-medium">Program Type:</span>{" "}
                  <span className="text-muted-foreground">
                    {selectedTemplate.program_type}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Applying this template may override the class's existing grading
          scheme configuration.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading || !selectedTemplateId}
            onClick={onConfirm}
          >
            {isLoading ? "Applying..." : "Apply Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
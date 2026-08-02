// ===== File: frontend/src/components/admin/grading-scheme-template/TemplatesList.tsx =====
"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

interface TemplatesListProps {
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (template: GradingSchemeTemplate) => void;
}

export function TemplatesList({
  templates,
  isLoading,
  onCreateClick,
  onEditClick,
}: TemplatesListProps): React.JSX.Element {
  if (isLoading) {
    return <div className="not-interactive">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No templates created yet.{" "}
          <button
            onClick={onCreateClick}
            className="text-primary hover:underline font-medium"
          >
            Create one now
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-4 space-y-2">
      {templates.map((template) => (
        <div
          key={template.id}
          className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1">
            <p className="text-sm font-medium not-interactive">{template.name}</p>
            {template.programType && (
              <p className="text-xs text-muted-foreground not-interactive">
                Type: {template.programType}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 not-interactive">
              {template.components?.length ?? 0} components
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEditClick(template)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

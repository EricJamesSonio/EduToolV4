// ===== File: frontend/src/components/admin/semester-settings/TemplateLibrary.tsx =====
"use client";

import { useMemo } from "react";
import { Plus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./TemplateCard";
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_COLORS,
} from "./constants";
import type { SemesterTemplate } from "@/types/admin/semester-template.types";
import type { ProgramType } from "@/types/admin/semester-template.types";

interface TemplateLibraryProps {
  templates: SemesterTemplate[];
  isLoading: boolean;
  isError?: boolean;
  onCreateClick: () => void;
  onCreateFromType: (type: string) => void;
  onEdit: (template: SemesterTemplate) => void;
  onDelete: (template: SemesterTemplate) => void;
}

export function TemplateLibrary({
  templates,
  isLoading,
  isError,
  onCreateClick,
  onCreateFromType,
  onEdit,
  onDelete,
}: TemplateLibraryProps): React.JSX.Element {
  const templatesByType = useMemo(() => {
    const map = new Map<string, SemesterTemplate[]>();
    for (const t of templates) {
      const arr = map.get(t.program_type) ?? [];
      arr.push(t);
      map.set(t.program_type, arr);
    }
    return map;
  }, [templates]);

  const templateTypes = useMemo(
    () => Array.from(templatesByType.keys()),
    [templatesByType]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || templateTypes.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No templates yet"
        description="Create your first semester template to define reusable semester and term structures."
        action={{ label: "New Template", onClick: onCreateClick }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {templateTypes.map((type) => {
        const typeTemplates = templatesByType.get(type) ?? [];
        const typeColor =
          PROGRAM_TYPE_COLORS[type as ProgramType] ??
          "badge-muted";
        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs border px-2 py-0.5 not-interactive", typeColor)}
              >
                {PROGRAM_TYPE_LABELS[type as ProgramType] ?? type}
              </Badge>
              <div className="flex-1 h-px bg-border" />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => onCreateFromType(type)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Template
              </Button>
            </div>
            <div className="space-y-2">
              {typeTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onEdit={() => onEdit(t)}
                  onDelete={() => onDelete(t)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
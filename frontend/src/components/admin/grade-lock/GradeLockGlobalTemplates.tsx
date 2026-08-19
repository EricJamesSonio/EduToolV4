// ===== File: frontend\src\components\admin\grade-lock\GradeLockGlobalTemplates.tsx =====
"use client";

import { format } from "date-fns";
import { Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GradeLockSetting } from "@/types/admin/grade-lock.types";

interface GradeLockGlobalTemplatesProps {
  templates: GradeLockSetting[];
  onEdit: (template: GradeLockSetting) => void;
}

export function GradeLockGlobalTemplates({
  templates,
  onEdit,
}: GradeLockGlobalTemplatesProps): React.ReactElement {
  return (
    <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Layers className="h-4 w-4" />
        <span className="not-interactive">Global Grade Lock Templates</span>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-1">
          {templates.map((t) => (
            <div key={t.id} className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-medium text-foreground">{t.name}</span>
              {t.is_default && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  default
                </span>
              )}
              {t.lock_deadline && (
                <span>— Deadline: {format(new Date(t.lock_deadline), "MMM d, yyyy h:mm a")}</span>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 ml-auto"
                onClick={() => onEdit(t)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground not-interactive">
          No templates configured yet.
        </div>
      )}
    </div>
  );
}
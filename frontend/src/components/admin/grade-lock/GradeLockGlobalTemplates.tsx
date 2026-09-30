// ===== File: frontend\src\components\admin\grade-lock\GradeLockGlobalTemplates.tsx =====
"use client";

import { format } from "date-fns";
import { Layers, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GradeLockSetting } from "@/types/admin/grade-lock.types";

interface GradeLockGlobalTemplatesProps {
  templates: GradeLockSetting[];
  onEdit: (template: GradeLockSetting) => void;
}

const LOCK_TYPE_LABELS: Record<string, string> = {
  hard: "Hard lock",
  soft: "Soft lock",
  flexible: "Flexible",
};

export function GradeLockGlobalTemplates({
  templates,
  onEdit,
}: GradeLockGlobalTemplatesProps): React.ReactElement {
  return (
    // Mirrors the GradeLockStats cards (bg-card + border + rounded-xl) so this
    // reads as a white surface instead of a grey block.
    <Card size="sm" className="gap-3">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium not-interactive">
          Global Grade Lock Templates
        </CardTitle>
        {templates.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground not-interactive">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </span>
        )}
      </CardHeader>

      <CardContent className="px-0">
        {templates.length > 0 ? (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/20"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 not-interactive">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {t.name}
                    </span>
                    {t.is_default && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                        default
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{LOCK_TYPE_LABELS[t.lockType] ?? t.lockType}</span>
                    {t.lock_deadline && (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          Deadline:{" "}
                          {format(new Date(t.lock_deadline), "MMM d, yyyy h:mm a")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 shrink-0 px-2"
                  onClick={() => onEdit(t)}
                  aria-label={`Edit ${t.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground not-interactive">
            No templates configured yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { Pencil, Trash2, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { GradingScheme } from "@/types/admin/grading-scheme.types";

interface GradingSchemeTemplateCardProps {
  // ⚠️ still GradingScheme type, but treated as TEMPLATE SOURCE
  scheme: GradingScheme;

  onEdit: (scheme: GradingScheme) => void;
  onDelete: (scheme: GradingScheme) => void;

  // FIXED: should be templateId + classId, NOT full scheme
  onApplyToClass: (templateId: string) => void;
}

export function GradingSchemeTemplateCard({
  scheme,
  onEdit,
  onDelete,
  onApplyToClass,
}: GradingSchemeTemplateCardProps) {
const components = Array.isArray(scheme?.components)
  ? scheme.components
  : [];

  const totalWeight = components
    .filter((c) => !c.isOptional)
    .reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4">

      {/* LEFT */}
      <div className="min-w-0 space-y-1.5">
        <p className="truncate text-base font-semibold">
          {scheme.name}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">

          {components.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No components
            </span>
          ) : (
            components.map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="gap-1 text-xs font-normal"
              >
                {c.name}
                <span className="text-muted-foreground">
                  {c.weight}%
                </span>
              </Badge>
            ))
          )}

          {components.length > 0 && (
            <span
              className={`ml-1 text-xs font-medium tabular-nums ${
                totalWeight === 100
                  ? "text-green-600"
                  : "text-destructive"
              }`}
            >
              {totalWeight}% total
            </span>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex shrink-0 items-center gap-1">

        {/* APPLY */}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onApplyToClass(scheme.id)}
        >
          <BookMarked className="h-3.5 w-3.5" />
          Apply
        </Button>

        {/* EDIT */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(scheme)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* DELETE */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(scheme)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
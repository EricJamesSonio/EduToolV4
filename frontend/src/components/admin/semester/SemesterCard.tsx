"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Semester } from "@/types/admin/semester.types";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SemesterCardProps {
  semester: Semester;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SemesterCard({ semester, onEdit, onDelete }: SemesterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{semester.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(semester.startDate)} → {formatDate(semester.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs font-normal">
            {semester.terms.length} term{semester.terms.length !== 1 ? "s" : ""}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={onEdit}
            title="Edit semester"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            title="Delete semester"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Expandable terms */}
      {expanded && semester.terms.length > 0 && (
        <div className={cn("border-t px-4 py-3 space-y-1.5")}>
          {[...semester.terms]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between text-sm rounded-md bg-muted/40 px-3 py-1.5"
              >
                <span className="font-medium text-sm">
                  <span className="text-muted-foreground text-xs mr-2">
                    {term.orderIndex}.
                  </span>
                  {term.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(term.startDate)} → {formatDate(term.endDate)}
                </span>
              </div>
            ))}
        </div>
      )}

      {expanded && semester.terms.length === 0 && (
        <div className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">No terms defined.</p>
        </div>
      )}
    </div>
  );
}
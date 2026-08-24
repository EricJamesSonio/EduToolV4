// src/components/admin/grading-scheme-template/GradingSchemeTemplateList.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { CHART_DOT_BG } from "@/lib/chart-colors";
import {
  PROGRAM_TYPE_COLORS,
  PROGRAM_TYPE_LABELS,
  type ProgramType,
} from "@/types/admin/program.types";
import { useDeleteGradingSchemeTemplate } from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface GradingSchemeTemplateListProps {
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
  isError?: boolean;
  onCreateClick: () => void;
  onEditClick: (template: GradingSchemeTemplate) => void;
}

export function GradingSchemeTemplateList({
  templates,
  isLoading,
  isError,
  onCreateClick,
  onEditClick,
}: GradingSchemeTemplateListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GradingSchemeTemplate | null>(null);
  const deleteMutation = useDeleteGradingSchemeTemplate();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Template deleted.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        const err = e as AxiosError<{ message: string }>;
        toast.error(err?.response?.data?.message ?? "Failed to delete.");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || templates.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="No templates yet"
        description="Create your first grading scheme template."
        action={{ label: "New Template", onClick: onCreateClick }}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() =>
                setExpanded(expanded === template.id ? null : template.id)
              }
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  expanded === template.id && "rotate-90"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate not-interactive">{template.name}</p>
                  {template.programType && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] border px-1.5 py-0 w-fit font-normal shrink-0 not-interactive",
                        PROGRAM_TYPE_COLORS[
                          template.programType as ProgramType
                        ] ?? "badge-muted",
                      )}
                    >
                      {PROGRAM_TYPE_LABELS[template.programType as ProgramType] ?? template.programType}
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground not-interactive">
                {template.components?.length ?? 0} component{(template.components?.length ?? 0) !== 1 ? "s" : ""}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(template);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(template);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded === template.id && (
              <div className="border-t px-4 py-3 bg-muted/20 space-y-2">
                {template.components?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic not-interactive">No components</p>
                ) : (
                  template.components?.map((comp, idx) => {
                    const dots  = CHART_DOT_BG;
                    const texts = ["text-[var(--chart-1)]", "text-[var(--chart-2)]", "text-[var(--chart-3)]", "text-[var(--chart-4)]", "text-[var(--chart-5)]", "text-[var(--chart-6)]", "text-[var(--chart-7)]", "text-[var(--chart-8)]", "text-[var(--chart-9)]", "text-[var(--chart-10)]"];
                    const bgs   = ["bg-chart-1/10", "bg-chart-2/10", "bg-chart-3/10", "bg-chart-4/10", "bg-chart-5/10", "bg-chart-6/10", "bg-chart-7/10", "bg-chart-8/10", "bg-chart-9/10", "bg-chart-10/10"];
                    const i = idx % 10;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full", dots[i])} />
                          <span className={cn("font-medium not-interactive", texts[i])}>{comp.name}</span>
                        </div>
                        <span className={cn("rounded-sm px-1.5 py-0.5 font-semibold not-interactive", bgs[i], texts[i])}>{comp.weight}%</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {deleteTarget && (
        <Dialog open onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete template?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Delete <strong>&quot;{deleteTarget.name}&quot;</strong>? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
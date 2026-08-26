// ===== File: frontend/src/components/admin/grading-scale/GradingScaleList.tsx =====
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PROGRAM_TYPE_COLORS, PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { CHART_DOT_BG } from "@/lib/chart-colors";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { GradingScale } from "@/types/admin/grading-scale.types";

interface GradingScaleListProps {
  scales: GradingScale[];
  isLoading: boolean;
  isError?: boolean;
  onCreateClick: () => void;
  onEditClick: (scale: GradingScale) => void;
}

function passingThreshold(scale: GradingScale): string {
  const passingRanges = scale.ranges.filter((r) => r.isPassing);
  if (passingRanges.length === 0) return "—";
  const min = Math.min(...passingRanges.map((r) => r.minPercent));
  return `${min}%`;
}

export function GradingScaleList({
  scales,
  isLoading,
  isError,
  onCreateClick,
  onEditClick,
}: GradingScaleListProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GradingScale | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradingScaleApi.delete(id),
    onSuccess: () => {
      toast.success("Grading scale deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.gradingScales.all });
      setDeleteTarget(null);
    },
    onError: (e) => {
      const err = e as AxiosError<{ message: string }>;
      toast.error(err?.response?.data?.message ?? "Failed to delete.");
      setDeleteTarget(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || scales.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="No grading scales yet"
        description="Create your first grading scale template."
        action={{ label: "New Scale", onClick: onCreateClick }}
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {scales.map((scale) => (
          <div
            key={scale.id}
            className={cn(
              "rounded-lg border bg-card transition-colors",
              expanded !== scale.id && "hover:bg-muted/30"
            )}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
              onClick={() =>
                setExpanded(expanded === scale.id ? null : scale.id)
              }
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  expanded === scale.id && "rotate-90"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate not-interactive">{scale.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] border px-1.5 py-0 w-fit font-normal shrink-0 not-interactive",
                      PROGRAM_TYPE_COLORS[
                        scale.programType as keyof typeof PROGRAM_TYPE_COLORS
                      ] ?? "badge-muted",
                    )}
                  >
                    {PROGRAM_TYPE_LABELS[scale.programType as keyof typeof PROGRAM_TYPE_LABELS] ?? scale.programType}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground not-interactive">
                  {scale.ranges.length} range{scale.ranges.length !== 1 ? "s" : ""}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {passingThreshold(scale)}
                </Badge>
              </div>
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
                      onEditClick(scale);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={scale.isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(scale);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expanded === scale.id && (
              <div className="border-t px-4 py-3 bg-muted/20 space-y-2">
                {scale.ranges.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic not-interactive">No ranges defined</p>
                ) : (
                  scale.ranges.map((range, idx) => {
                    const clrs = [["text-[var(--chart-1)]", "bg-chart-1/10 text-[var(--chart-1)]"], ["text-[var(--chart-2)]", "bg-chart-2/10 text-[var(--chart-2)]"], ["text-[var(--chart-3)]", "bg-chart-3/10 text-[var(--chart-3)]"], ["text-[var(--chart-4)]", "bg-chart-4/10 text-[var(--chart-4)]"], ["text-[var(--chart-5)]", "bg-chart-5/10 text-[var(--chart-5)]"], ["text-[var(--chart-6)]", "bg-chart-6/10 text-[var(--chart-6)]"], ["text-[var(--chart-7)]", "bg-chart-7/10 text-[var(--chart-7)]"], ["text-[var(--chart-8)]", "bg-chart-8/10 text-[var(--chart-8)]"], ["text-[var(--chart-9)]", "bg-chart-9/10 text-[var(--chart-9)]"], ["text-[var(--chart-10)]", "bg-chart-10/10 text-[var(--chart-10)]"]];
                    const c = clrs[idx % 10];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className={cn("font-medium not-interactive", c[0])}>
                          {range.gradeValue} ({range.minPercent}–{range.maxPercent}%)
                        </span>
                        <div className="flex items-center gap-2">
                          {range.isPassing && (
                            <span className={cn("inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold not-interactive", c[1])}>Passing</span>
                          )}
                        </div>
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
              <DialogTitle>Delete grading scale?</DialogTitle>
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
                disabled={deleteMutation.isPending || deleteTarget.isLocked}
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
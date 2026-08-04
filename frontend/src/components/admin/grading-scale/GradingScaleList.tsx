// ===== File: frontend/src/components/admin/grading-scale/GradingScaleList.tsx =====
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronRight, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { WEEK_COLORS } from "@/lib/palette";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale } from "@/types/admin/grading-scale.types";

interface GradingScaleListProps {
  scales: GradingScale[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
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
  onRetry,
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
      queryClient.invalidateQueries({ queryKey: ["admin", "gradingScales"] });
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Failed to load grading scales</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (scales.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground not-interactive">No grading scales yet</p>
        <p className="text-xs text-muted-foreground mt-1 not-interactive">Create your first grading scale template</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={onCreateClick}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> New Scale
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {scales.map((scale) => (
          <div
            key={scale.id}
            className="rounded-lg border bg-card hover:bg-muted/30 transition-colors"
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
                <p className="text-sm font-medium truncate not-interactive">{scale.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs border px-2 py-0.5 font-normal",
                    PROGRAM_TYPE_COLORS[
                      scale.programType as keyof typeof PROGRAM_TYPE_COLORS
                    ] ?? "",
                  )}
                >
                  {PROGRAM_TYPE_LABELS[scale.programType as keyof typeof PROGRAM_TYPE_LABELS] ?? scale.programType}
                </Badge>
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
                    const clrs = [["text-blue-600", "bg-blue-500/10 text-blue-600"], ["text-emerald-600", "bg-emerald-500/10 text-emerald-600"], ["text-purple-600", "bg-purple-500/10 text-purple-600"], ["text-amber-600", "bg-amber-500/10 text-amber-600"], ["text-teal-600", "bg-teal-500/10 text-teal-600"], ["text-indigo-600", "bg-indigo-500/10 text-indigo-600"], ["text-pink-600", "bg-pink-500/10 text-pink-600"], ["text-cyan-600", "bg-cyan-500/10 text-cyan-600"], ["text-orange-600", "bg-orange-500/10 text-orange-600"], ["text-rose-600", "bg-rose-500/10 text-rose-600"]];
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
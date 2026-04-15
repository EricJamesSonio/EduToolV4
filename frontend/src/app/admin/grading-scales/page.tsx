"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import { useGradingScales } from "@/hooks/admin/useGradingScales";
import type { GradingScale } from "@/types/admin/grading-scale.types";
import { CreateGradingScaleDialog } from "@/components/admin/grading-scale/CreateGradingScaleDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Lock, BarChart2 } from "lucide-react";
import type { AxiosError } from "axios";

export default function GradingScalesPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradingScale | null>(null);

  const { data: scales = [], isLoading } = useGradingScales();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradingScaleApi.delete(id),
    onSuccess: () => {
      toast.success("Grading scale deleted.");
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete grading scale.");
      setDeleteTarget(null);
    },
  });

  // Compute passing threshold per scale — lowest minPercent where isPassing = true
  const passingThreshold = (scale: GradingScale): string => {
    const passingRanges = scale.ranges.filter((r) => r.isPassing);
    if (passingRanges.length === 0) return "—";
    const min = Math.min(...passingRanges.map((r) => r.minPercent));
    return `${min}%`;
  };

  const columns = useMemo<ColumnDef<GradingScale>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "ranges",
        header: "Ranges",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original.ranges.length} range{row.original.ranges.length !== 1 ? "s" : ""}
          </span>
        ),
      },
      {
        id: "passingThreshold",
        header: "Passing Threshold",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {passingThreshold(row.original)}
          </Badge>
        ),
      },
      {
        id: "lockStatus",
        header: "Lock Status",
        cell: ({ row }) =>
          row.original.isLocked ? (
            <div className="flex items-center gap-1.5 text-amber-600">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Locked</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Unlocked</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => router.push(`/admin/grading-scales/${row.original.id}`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              View/Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              disabled={row.original.isLocked}
              onClick={() => setDeleteTarget(row.original)}
              title={row.original.isLocked ? "Cannot delete a locked scale" : "Delete scale"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Scales"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Scale
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={scales}
          emptyTitle="No grading scales"
          emptyDescription="Create your first grading scale to define how scores map to grades."
        />
      )}

      <CreateGradingScaleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this grading scale?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete Scale"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
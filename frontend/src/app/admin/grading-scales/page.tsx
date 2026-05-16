"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Lock, Layers, Check } from "lucide-react";
import type { AxiosError } from "axios";

import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { CreateGradingScaleDialog } from "@/components/admin/grading-scale/CreateGradingScaleDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useGradingScales } from "@/hooks/admin/useGradingScales";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { usePrograms } from "@/hooks/admin/usePrograms";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";

import type { GradingScale } from "@/types/admin/grading-scale.types";

export default function GradingScalesPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradingScale | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [assignTarget, setAssignTarget] = useState<{ scale: GradingScale; program: any } | null>(null);

  // Queries
  const { data: schoolYears = [], isLoading: schoolYearsLoading } = useSchoolYears();
  const { data: scales = [], isLoading: scalesLoading } = useGradingScales();
  const { data: programs = [], isLoading: programsLoading } = usePrograms(
    selectedSchoolYearId ?? undefined
  );

  // Mutations
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

  // Note: Assignment is actually done via creating a new scale for the program
  // This is a confirmation before the user goes to create a new scale for that program
  const handleAssignConfirm = () => {
    if (!assignTarget) return;
    // Redirect to create dialog or edit dialog with program pre-selected
    toast.info(`Create a new grading scale for ${assignTarget.program.name} program.`);
    setAssignTarget(null);
    setCreateOpen(true);
  };

  // Compute passing threshold
  const passingThreshold = (scale: GradingScale): string => {
    const passingRanges = scale.ranges.filter((r) => r.isPassing);
    if (passingRanges.length === 0) return "—";
    const min = Math.min(...passingRanges.map((r) => r.minPercent));
    return `${min}%`;
  };

  // Get selected program
  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );

  // Filter scales by selected program
  const filteredScales = useMemo(() => {
    if (!selectedProgramId) return scales;
    return scales.filter((scale) => scale.programId === selectedProgramId);
  }, [scales, selectedProgramId]);

  // Table columns
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
              title="View and edit scale details"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
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
    <div className="space-y-8 p-6">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grading Scales"
        description="Create and manage grading scale templates for different program types."
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Scale
          </Button>
        }
      />

      {/* ================= SCHOOL YEAR SELECTOR ================= */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <SchoolYearSelector
          schoolYears={schoolYears}
          isLoading={schoolYearsLoading}
          selectedId={selectedSchoolYearId}
          onSelect={setSelectedSchoolYearId}
        />
      </div>

      {/* ================= PROGRAM FILTER ================= */}
      {selectedSchoolYearId && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers className="h-4 w-4" />
            Filter by Program
          </div>

          {programsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : programs.length > 0 ? (
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a program to filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} ({program.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">
              No programs found for this school year.
            </div>
          )}

          {selectedProgram && (
            <div className="rounded-md border bg-background p-3 text-sm">
              <p className="text-muted-foreground">
                Showing scales for: <span className="font-medium text-foreground">{selectedProgram.name}</span>{" "}
                <Badge variant="secondary" className="text-xs ml-2">
                  {selectedProgram.type}
                </Badge>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= SCALES TABLE ================= */}
      {scalesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredScales}
          isLoading={scalesLoading}
          emptyTitle={selectedProgramId ? "No grading scales" : "No grading scales"}
          emptyDescription={
            selectedProgramId
              ? `No grading scales created for ${selectedProgram?.name} yet.`
              : "Select a program or create your first grading scale."
          }
        />
      )}

      {/* ================= CREATE DIALOG ================= */}
      <CreateGradingScaleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultProgramId={selectedProgramId || undefined}
      />

      {/* ================= DELETE CONFIRM ================= */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete grading scale?"
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete Scale"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
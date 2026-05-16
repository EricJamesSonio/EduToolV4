"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Check, AlertCircle } from "lucide-react";
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

interface ProgramWithScale {
  id: string;
  name: string;
  type: string;
  assignedScaleId?: string;
  assignedScaleName?: string;
}

export default function GradingScalesPage(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GradingScale | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<ProgramWithScale | null>(null);
  const [selectedScaleId, setSelectedScaleId] = useState<string>("");

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

  const assignMutation = useMutation({
    mutationFn: ({
      programId,
      scaleId,
    }: {
      programId: string;
      scaleId: string;
    }) => gradingScaleApi.assignToProgram(programId, scaleId),
    onSuccess: () => {
      toast.success("Grading scale assigned to program successfully.");
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
      setAssignTarget(null);
      setSelectedScaleId("");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to assign grading scale.");
    },
  });

  // Map programs with their assigned scales
  const programsWithScales = useMemo(() => {
    return programs.map((program) => {
      const assignedScale = scales.find((s) => s.programId === program.id);
      return {
        ...program,
        assignedScaleId: assignedScale?.id,
        assignedScaleName: assignedScale?.name,
      };
    });
  }, [programs, scales]);

  // Get selected scale from state
  const selectedScale = useMemo(
    () => scales.find((s) => s.id === selectedScaleId),
    [scales, selectedScaleId]
  );

  // Helper to compute passing threshold
  const passingThreshold = (scale: GradingScale): string => {
    const passingRanges = scale.ranges.filter((r) => r.isPassing);
    if (passingRanges.length === 0) return "—";
    const min = Math.min(...passingRanges.map((r) => r.minPercent));
    return `${min}%`;
  };

  // Table columns for global scales
  const scaleColumns = useMemo<ColumnDef<GradingScale>[]>(
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

  // Table columns for program assignments
  const programColumns = useMemo<ColumnDef<ProgramWithScale>[]>(
    () => [
      {
        id: "name",
        header: "Program",
        cell: ({ row }) => (
          <div className="space-y-1">
            <span className="font-medium">{row.original.name}</span>
            <Badge variant="secondary" className="text-xs">
              {row.original.type}
            </Badge>
          </div>
        ),
      },
      {
        id: "assignedScale",
        header: "Assigned Scale",
        cell: ({ row }) =>
          row.original.assignedScaleName ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{row.original.assignedScaleName}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Not assigned</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
            onClick={() => {
              setAssignTarget(row.original);
              setSelectedScaleId(row.original.assignedScaleId || "");
            }}
            title="Assign or change grading scale"
          >
            <Check className="h-3.5 w-3.5" />
            {row.original.assignedScaleName ? "Change" : "Assign"}
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-8 p-6">
      {/* ================= HEADER ================= */}
      <PageHeader
        title="Grading Scales"
        description="Manage global grading scale templates and assign them to programs."
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Scale
          </Button>
        }
      />

      {/* ================= GLOBAL SCALES SECTION ================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Global Templates</h2>
          <Badge variant="outline">{scales.length} scales</Badge>
        </div>

        {scalesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={scaleColumns}
            data={scales}
            emptyTitle="No grading scales"
            emptyDescription="Create your first grading scale template."
          />
        )}
      </div>

      {/* ================= ASSIGNMENT SECTION ================= */}
      {scales.length > 0 && (
        <>
          <div className="border-t pt-8" />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Assign to Programs</h2>

            <div className="rounded-lg border p-4 bg-muted/30">
              <SchoolYearSelector
                schoolYears={schoolYears}
                isLoading={schoolYearsLoading}
                selectedId={selectedSchoolYearId}
                onSelect={setSelectedSchoolYearId}
              />
            </div>

            {/* ================= PROGRAMS TABLE ================= */}
            {selectedSchoolYearId && (
              <>
                {programsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <DataTable
                    columns={programColumns}
                    data={programsWithScales}
                    emptyTitle="No programs"
                    emptyDescription="No programs found for this school year."
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ================= CREATE DIALOG ================= */}
      <CreateGradingScaleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
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

      {/* ================= ASSIGN SCALE MODAL ================= */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4 border">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Assign Grading Scale</h2>
            </div>

            {/* Program Info */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Program</p>
              <p className="font-medium text-sm">{assignTarget.name}</p>
              <Badge variant="secondary" className="text-xs">
                {assignTarget.type}
              </Badge>
            </div>

            {/* Scale Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Scale</label>
              <Select value={selectedScaleId} onValueChange={setSelectedScaleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a grading scale..." />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((scale) => (
                    <SelectItem key={scale.id} value={scale.id}>
                      {scale.name} ({scale.ranges.length} ranges)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Scale Details */}
            {selectedScale && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Scale Details</p>
                <p className="font-medium text-sm">{selectedScale.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{selectedScale.ranges.length} grade ranges</span>
                  <span>Passing: {passingThreshold(selectedScale)}</span>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-900">
                Are you sure you want to assign this grading scale to{" "}
                <span className="font-medium">{assignTarget.name}</span>?
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignTarget(null);
                  setSelectedScaleId("");
                }}
                disabled={assignMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={() => {
                  if (!assignTarget || !selectedScaleId) return;
                  assignMutation.mutate({
                    programId: assignTarget.id,
                    scaleId: selectedScaleId,
                  });
                }}
                disabled={assignMutation.isPending || !selectedScaleId}
              >
                {assignMutation.isPending ? "Assigning..." : "Yes, Assign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ===== File: frontend/src/components/admin/grading-scale/GradingScaleAssignmentSection.tsx =====
"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Check } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import { DataTable } from "@/components/shared/DataTable";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { GradingScale } from "@/types/admin/grading-scale.types";

interface Program {
  id: string;
  name: string;
  type: string;
}

interface ProgramWithScale extends Program {
  assignedScaleId?: string;
  assignedScaleName?: string;
}

interface GradingScaleAssignmentSectionProps {
  schoolYears: SchoolYear[];
  programs: Program[];
  scales: GradingScale[];
  schoolYearsLoading: boolean;
  programsLoading: boolean;
  selectedSchoolYearId: string | null;
  onYearSelect: (yearId: string | null) => void;
}

function passingThreshold(scale: GradingScale): string {
  const passingRanges = scale.ranges.filter((r) => r.isPassing);
  if (passingRanges.length === 0) return "—";
  const min = Math.min(...passingRanges.map((r) => r.minPercent));
  return `${min}%`;
}

export function GradingScaleAssignmentSection({
  schoolYears,
  programs,
  scales,
  schoolYearsLoading,
  programsLoading,
  selectedSchoolYearId,
  onYearSelect,
}: GradingScaleAssignmentSectionProps): React.JSX.Element {
  const queryClient = useQueryClient();

  // State
  const [assignTarget, setAssignTarget] = useState<ProgramWithScale | null>(
    null,
  );
  const [selectedScaleId, setSelectedScaleId] = useState<string>("");

  // Mutation
  const assignMutation = useMutation({
    mutationFn: ({
      programId,
      scaleId,
    }: {
      programId: string;
      scaleId: string;
    }) => gradingScaleApi.assignToProgram(programId, scaleId),
    onSuccess: () => {
      toast.success("Grading scale assigned successfully.");
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
      setAssignTarget(null);
      setSelectedScaleId("");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to assign grading scale.",
      );
    },
  });

  // Map programs with assigned scales
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

  // Get selected scale
  const selectedScale = useMemo(
    () => scales.find((s) => s.id === selectedScaleId),
    [scales, selectedScaleId],
  );

  // Table columns
  const programColumns = useMemo<ColumnDef<ProgramWithScale>[]>(
    () => [
      {
        id: "name",
        header: "Program",
        cell: ({ row }) => (
          <div className="space-y-1">
            <span className="font-medium text-sm">{row.original.name}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs border px-2 py-0.5 w-fit font-normal",
                PROGRAM_TYPE_COLORS[
                  row.original.type as keyof typeof PROGRAM_TYPE_COLORS
                ] ?? "bg-slate-500/10 text-slate-600 border-slate-200",
              )}
            >
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
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">
                {row.original.assignedScaleName}
              </span>
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
          >
            <Check className="h-3.5 w-3.5" />
            {row.original.assignedScaleName ? "Change" : "Assign"}
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Assign to Programs</h2>

        <div className="rounded-lg border p-4 bg-muted/30">
          <SchoolYearSelector
            schoolYears={schoolYears}
            isLoading={schoolYearsLoading}
            selectedId={selectedSchoolYearId}
            onSelect={onYearSelect}
          />
        </div>

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

      {/* Assign Scale Modal */}
      {assignTarget && (
        <Dialog
          open={!!assignTarget}
          onOpenChange={(o) => {
            if (!o) {
              setAssignTarget(null);
              setSelectedScaleId("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Assign Grading Scale
              </DialogTitle>
            </DialogHeader>

            {/* Program Info */}
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Program</p>
              <p className="font-medium text-sm">{assignTarget.name}</p>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs border px-2 py-0.5 w-fit font-normal",
                  PROGRAM_TYPE_COLORS[
                    assignTarget.type as keyof typeof PROGRAM_TYPE_COLORS
                  ] ?? "bg-slate-500/10 text-slate-600 border-slate-200",
                )}
              >
                {assignTarget.type}
              </Badge>
            </div>

            {/* Scale Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Scale</label>
              <Select
                value={selectedScaleId}
                onValueChange={setSelectedScaleId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a grading scale..." />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((scale, i) => (
                    <SelectItem key={scale.id} value={scale.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500"][i % 10])} />
                        {scale.name} ({scale.ranges.length} ranges)
                      </div>
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
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

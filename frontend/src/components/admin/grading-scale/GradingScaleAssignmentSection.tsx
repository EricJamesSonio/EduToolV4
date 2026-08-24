"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import { CHART_DOT_BG } from "@/lib/chart-colors";
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
import type { GradingScale, GradingScaleAssignment } from "@/types/admin/grading-scale.types";

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
  assignments: GradingScaleAssignment[];
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
  assignments,
  schoolYearsLoading,
  programsLoading,
  selectedSchoolYearId,
  onYearSelect,
}: GradingScaleAssignmentSectionProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const [assignTarget, setAssignTarget] = useState<ProgramWithScale | null>(null);
  const [selectedScaleId, setSelectedScaleId] = useState<string>("");

  const assignMutation = useMutation({
    mutationFn: ({
      programId,
      scaleId,
    }: {
      programId: string;
      scaleId: string;
    }) => gradingScaleApi.assignToProgram(programId, scaleId, selectedSchoolYearId!),
    onSuccess: () => {
      toast.success("Grading scale assigned successfully.");
      const assignKey = ["admin", "gradingScales", "assignments", selectedSchoolYearId!] as const;
      const current = queryClient.getQueryData<GradingScaleAssignment[]>(assignKey) ?? [];
      const newAssign: GradingScaleAssignment = {
        id: "",
        orgId: "",
        gradingScaleId: selectedScaleId,
        programId: assignTarget!.id,
        schoolYearId: selectedSchoolYearId!,
        createdAt: new Date().toISOString(),
        grading_scale: { name: selectedScale?.name ?? "" },
        program: { name: assignTarget!.name },
      };
      queryClient.setQueryData(assignKey, [...current.filter(a => a.programId !== assignTarget!.id), newAssign]);
      queryClient.invalidateQueries({ queryKey: assignKey });
      setAssignTarget(null);
      setSelectedScaleId("");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to assign grading scale.",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({
      programId,
    }: {
      programId: string;
    }) => gradingScaleApi.removeAssignment(programId, selectedSchoolYearId!),
    onSuccess: (_data, variables) => {
      toast.success("Assignment removed.");
      const assignKey = ["admin", "gradingScales", "assignments", selectedSchoolYearId!] as const;
      const current = queryClient.getQueryData<GradingScaleAssignment[]>(assignKey) ?? [];
      queryClient.setQueryData(assignKey, current.filter(a => a.programId !== variables.programId));
      queryClient.invalidateQueries({ queryKey: assignKey });
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to remove assignment.",
      );
    },
  });

  const assignmentsByProgram = useMemo(() => {
    const map = new Map<string, GradingScaleAssignment>();
    for (const a of assignments) {
      map.set(a.programId, a);
    }
    return map;
  }, [assignments]);

  const programsWithScales = useMemo(() => {
    return programs.map((program) => {
      const assignment = assignmentsByProgram.get(program.id);
      const scale = assignment
        ? scales.find((s) => s.id === assignment.gradingScaleId)
        : undefined;
      return {
        ...program,
        assignedScaleId: scale?.id,
        assignedScaleName: scale?.name,
      };
    });
  }, [programs, assignmentsByProgram, scales]);

  const selectedScale = useMemo(
    () => scales.find((s) => s.id === selectedScaleId),
    [scales, selectedScaleId],
  );

  const compatibleScales = useMemo(() => {
    if (!assignTarget) return scales;
    return scales.filter((s) => s.programType === assignTarget.type);
  }, [scales, assignTarget]);

  const programColumns = useMemo<ColumnDef<ProgramWithScale>[]>(
    () => [
      {
        id: "name",
        header: "Department",
        cell: ({ row }) => (
          <div className="space-y-1">
            <span className="font-medium text-sm not-interactive">{row.original.name}</span>
            <Badge
              variant="outline"
                className={cn(
                  "text-xs border px-2 py-0.5 w-fit font-normal",
                  PROGRAM_TYPE_COLORS[
                    row.original.type as keyof typeof PROGRAM_TYPE_COLORS
                  ] ?? "badge-muted",
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
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm font-medium not-interactive">
                {row.original.assignedScaleName}
              </span>
            </div>
          ) : (
              <span className="text-sm text-muted-foreground not-interactive">Not assigned</span>
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
              className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
              onClick={() => {
                setAssignTarget(row.original);
                setSelectedScaleId(row.original.assignedScaleId || "");
              }}
            >
              <Check className="h-3.5 w-3.5" />
              {row.original.assignedScaleName ? "Change" : "Assign"}
            </Button>
            {row.original.assignedScaleName && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm(`Remove assignment from "${row.original.name}"?`)) {
                    removeMutation.mutate({ programId: row.original.id });
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [removeMutation],
  );

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold not-interactive">Assign to Departments</h2>

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
                emptyTitle="No departments"
                emptyDescription="No departments found for this school year."
              />
            )}
          </>
        )}
      </div>

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

            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground not-interactive">Department</p>
              <p className="font-medium text-sm not-interactive">{assignTarget.name}</p>
              <Badge
                variant="outline"
                className={cn(
                    "text-xs border px-2 py-0.5 w-fit font-normal",
                    PROGRAM_TYPE_COLORS[
                      assignTarget.type as keyof typeof PROGRAM_TYPE_COLORS
                    ] ?? "badge-muted",
                  )}
              >
                {assignTarget.type}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium not-interactive">Select Scale</label>
              <Select
                value={selectedScaleId}
                onValueChange={(v) => setSelectedScaleId(v ?? "")}
              >
<SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a grading scale...">
                      {compatibleScales.find((s) => s.id === selectedScaleId)?.name ?? "Choose a grading scale..."}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {compatibleScales.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground not-interactive">
                      No scales available for this department type
                    </div>
                  ) : (
                    compatibleScales.map((scale, i) => (
                      <SelectItem key={scale.id} value={scale.id}>
                        <div className="flex items-center gap-2">
                           <div className={cn("h-2 w-2 rounded-full shrink-0", CHART_DOT_BG[i % 10])} />
                          {scale.name} ({scale.ranges.length} ranges)
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedScale && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground not-interactive">Scale Details</p>
                <p className="font-medium text-sm not-interactive">{selectedScale.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground not-interactive">
                  <span>{selectedScale.ranges.length} grade ranges</span>
                  <span>Passing: {passingThreshold(selectedScale)}</span>
                </div>
              </div>
            )}

            <div className="rounded-md bg-info/10 border border-info/20 p-3">
              <p className="text-xs text-info not-interactive">
                Are you sure you want to assign this grading scale to{" "}
                <span className="font-medium">{assignTarget.name}</span>?
              </p>
            </div>

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

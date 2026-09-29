"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { HierarchyScope } from "@/api/admin/subject-hierarchy.api";

export interface HierarchyFilterValue extends HierarchyScope {
  programType?: string;
}

interface Props {
  value: HierarchyFilterValue;
  onChange: (v: HierarchyFilterValue) => void;
}

/**
 * Scope picker: School Year → Department → (Course | Strand).
 * Cached with long staleTime so switching back never refetches.
 */
export function SubjectHierarchyFilter({ value, onChange }: Props): React.JSX.Element {
  const { data: schoolYears = [] } = useQuery({
    queryKey: ["admin", "schoolYears", "list"],
    queryFn: () => schoolYearApi.getAll(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "programs", value.schoolYearId ?? "none"],
    queryFn: () => programApi.getAll(value.schoolYearId as string),
    enabled: !!value.schoolYearId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const selectedProgram = useMemo(
    () => programs.find((p) => p.id === value.programId) ?? null,
    [programs, value.programId],
  );
  const isCollege = selectedProgram?.type === "college";
  const isShs = selectedProgram?.type === "shs";

  // Explicit trigger labels (never raw UUIDs): Base-UI Select.Value falls back
  // to rendering the raw value when the matching item isn't mounted yet
  // (async options), so we render the resolved name ourselves.
  const schoolYearLabel = schoolYears.find((s) => s.id === value.schoolYearId)?.name ?? null;
  const programLabel = selectedProgram
    ? `${selectedProgram.name} · ${selectedProgram.type}`
    : null;
  const courseLabel =
    selectedProgram?.courses?.find((c) => c.id === value.courseId)?.name ?? null;
  const strandLabel =
    selectedProgram?.strands?.find((s) => s.id === value.strandId)?.name ?? null;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5 min-w-44">
        <Label>School Year</Label>
        <Select
          value={value.schoolYearId ?? ""}
          onValueChange={(v) =>
            onChange({ schoolYearId: v || undefined, programId: undefined, courseId: undefined, strandId: undefined })
          }
        >
          <SelectTrigger>
            {schoolYearLabel ? (
              <span className="flex flex-1 truncate text-left">{schoolYearLabel}</span>
            ) : (
              <SelectValue placeholder="Select school year" />
            )}
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map((sy) => (
              <SelectItem key={sy.id} value={sy.id}>
                {sy.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-52">
        <Label>Department</Label>
        <Select
          value={value.programId ?? ""}
          onValueChange={(v) =>
            onChange({ ...value, programId: v || undefined, courseId: undefined, strandId: undefined })
          }
          disabled={!value.schoolYearId}
        >
          <SelectTrigger>
            {programLabel ? (
              <span className="flex flex-1 truncate text-left">{programLabel}</span>
            ) : (
              <SelectValue placeholder={value.schoolYearId ? "Select department" : "Select school year first"} />
            )}
          </SelectTrigger>
          <SelectContent>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name} <span className="text-xs text-muted-foreground ml-1">· {p.type}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCollege && selectedProgram && (
        <div className="space-y-1.5 min-w-52">
          <Label>Course</Label>
          <Select
            value={value.courseId ?? ""}
            onValueChange={(v) => onChange({ ...value, courseId: v || undefined })}
          >
            <SelectTrigger>
              {courseLabel ? (
                <span className="flex flex-1 truncate text-left">{courseLabel}</span>
              ) : (
                <SelectValue placeholder="Select course" />
              )}
            </SelectTrigger>
            <SelectContent>
              {(selectedProgram.courses ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code ? `${c.code} – ${c.name}` : c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isShs && selectedProgram && (
        <div className="space-y-1.5 min-w-52">
          <Label>Strand</Label>
          <Select
            value={value.strandId ?? ""}
            onValueChange={(v) => onChange({ ...value, strandId: v || undefined })}
          >
            <SelectTrigger>
              {strandLabel ? (
                <span className="flex flex-1 truncate text-left">{strandLabel}</span>
              ) : (
                <SelectValue placeholder="Select strand" />
              )}
            </SelectTrigger>
            <SelectContent>
              {(selectedProgram.strands ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

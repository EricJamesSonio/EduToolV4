"use client";

import { useMemo, useState } from "react";
import { Eye, GraduationCap, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  SemesterSelector,
  ALL_SEMESTERS,
} from "@/components/shared/SemesterSelector";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useSemestersByYear } from "@/hooks/admin/useSemester";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi, type GroupedSemester } from "@/api/admin/program.api";
import { getCurrentSemesterId } from "@/utils/semester.utils";
import type { StudentEnrollment } from "@/api/admin/student.api";
import { EnrollmentClassDialog } from "./EnrollmentClassDialog";

interface Props {
  enrollments: StudentEnrollment[];
  isLoading: boolean;
  programIds: string[];
  onEnroll: () => void;
  onRemove: (enrollment: StudentEnrollment) => void;
}

function enrollmentYearId(e: StudentEnrollment): string | null {
  return e.class?.school_year_id ?? e.school_year_id ?? null;
}

function enrollmentSemesterId(e: StudentEnrollment): string | null {
  return e.class?.semester_id ?? e.semester_id ?? null;
}

export function StudentEnrollmentsList({
  enrollments,
  isLoading,
  programIds,
  onEnroll,
  onRemove,
}: Props): React.JSX.Element {
  const hasProgram = programIds.length > 0;
  const [viewTarget, setViewTarget] = useState<StudentEnrollment | null>(null);
  const [yearOverride, setYearOverride] = useState<string | null>(null);
  const [semesterOverride, setSemesterOverride] = useState<string | null>(null);

  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );
  const schoolYears = useMemo(() => schoolYearsRaw ?? [], [schoolYearsRaw]);

  const yearNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sy of schoolYears) {
      map.set(sy.id, sy.name);
    }
    return map;
  }, [schoolYears]);

  const getYearName = (e: StudentEnrollment): string | null => {
    const yearId = enrollmentYearId(e);
    if (!yearId) return null;
    return yearNameById.get(yearId) ?? null;
  };

  // Default year: the active year when the student has enrollments in it,
  // otherwise the first year that has any, otherwise the active/first year.
  const defaultYearId = useMemo(() => {
    const withEnrollments = new Set(
      enrollments
        .map(enrollmentYearId)
        .filter((v): v is string => !!v),
    );
    const activeId = schoolYears.find((sy) => sy.status === "active")?.id ?? null;
    return (
      (activeId && withEnrollments.has(activeId) ? activeId : null) ??
      schoolYears.find((sy) => withEnrollments.has(sy.id))?.id ??
      activeId ??
      schoolYears[0]?.id ??
      null
    );
  }, [enrollments, schoolYears]);

  const schoolYearId =
    yearOverride && schoolYears.some((sy) => sy.id === yearOverride)
      ? yearOverride
      : defaultYearId;

  // Semesters of the selected year. Dated rows drive the program scoping and
  // the today-default; grouped rows carry the labels the selector renders.
  const { data: datedRaw, isLoading: datedLoading } = useSemestersByYear(
    schoolYearId ?? undefined,
  );
  const { data: groupedRaw, isLoading: groupedLoading } = useAsyncQuery(
    queryKeys.admin.programs.semestersGrouped(schoolYearId ?? null),
    () => programApi.getSemestersGrouped(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  const scopedDated = useMemo(() => {
    const all = datedRaw ?? [];
    if (programIds.length === 0) return all;
    const scoped = all.filter((s) => programIds.includes(s.programId));
    // A past year may belong to a different program than today's placement;
    // fall back to every semester of that year rather than an empty list.
    return scoped.length > 0 ? scoped : all;
  }, [datedRaw, programIds]);

  const semesterOptions: GroupedSemester[] = useMemo(() => {
    const allowed = new Set(scopedDated.map((s) => s.id));
    const seen = new Set<string>();
    const out: GroupedSemester[] = [];
    for (const o of groupedRaw ?? []) {
      if (!allowed.has(o.semesterId)) continue;
      if (seen.has(o.semesterId)) continue;
      seen.add(o.semesterId);
      out.push(o);
    }
    return out;
  }, [groupedRaw, scopedDated]);

  const defaultSemesterId =
    getCurrentSemesterId(scopedDated) ?? ALL_SEMESTERS;

  const optionsReady = !!schoolYearId && !groupedLoading && !datedLoading;
  const semesterId = useMemo(() => {
    if (
      semesterOverride &&
      (semesterOverride === ALL_SEMESTERS ||
        semesterOptions.some((o) => o.semesterId === semesterOverride))
    ) {
      return semesterOverride;
    }
    if (!optionsReady) return semesterOverride ?? ALL_SEMESTERS;
    return defaultSemesterId;
  }, [semesterOverride, semesterOptions, optionsReady, defaultSemesterId]);

  const handleSelectYear = (yearId: string) => {
    setYearOverride(yearId);
    // A semester from the previous year is meaningless now; follow the new
    // year's default instead.
    setSemesterOverride(null);
  };

  const visibleEnrollments = useMemo(
    () =>
      enrollments.filter((e) => {
        const yearId = enrollmentYearId(e);
        if (schoolYearId && yearId && yearId !== schoolYearId) return false;
        if (semesterId !== ALL_SEMESTERS) {
          if (enrollmentSemesterId(e) !== semesterId) return false;
        }
        return true;
      }),
    [enrollments, schoolYearId, semesterId],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="w-full sm:w-auto">
          <SchoolYearSelector
            schoolYears={schoolYears}
            isLoading={schoolYearsLoading}
            selectedId={schoolYearId}
            onSelect={handleSelectYear}
          />
        </div>
        <div className="w-full sm:w-auto">
          <SemesterSelector
            options={semesterOptions}
            isLoading={!!schoolYearId && (groupedLoading || datedLoading)}
            selectedId={semesterId}
            onSelect={setSemesterOverride}
            disabled={!schoolYearId}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold not-interactive">Enrollments</h2>
            {!isLoading && (
              <span className="text-xs text-muted-foreground not-interactive">
                ({visibleEnrollments.length})
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onEnroll}
            disabled={!hasProgram}
            title={!hasProgram ? "Please enroll the student in a department first" : ""}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Enroll in Class
          </Button>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : visibleEnrollments.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {enrollments.length === 0
                ? "No enrollments yet."
                : "No enrollments for the selected school year and semester."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {visibleEnrollments.map((e) => {
              const yearName = getYearName(e);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                    <button
                      type="button"
                      onClick={() => setViewTarget(e)}
                      className="text-left text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
                      title="View class details"
                    >
                      {e.class?.subject?.name ?? e.class_id}
                    </button>
                    <StatusBadge status={e.status} />
                    {yearName && (
                      <span className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground not-interactive">
                        SY {yearName}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setViewTarget(e)}
                      title="View class details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(e)}
                      title="Remove enrollment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewTarget && (
          <EnrollmentClassDialog
            open
            classId={viewTarget.class_id}
            enrollmentStatus={viewTarget.status}
            onClose={() => setViewTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
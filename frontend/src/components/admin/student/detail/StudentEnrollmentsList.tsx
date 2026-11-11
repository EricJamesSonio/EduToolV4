"use client";

import { useMemo, useState } from "react";
import { Eye, GraduationCap, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { StudentEnrollment } from "@/api/admin/student.api";
import { EnrollmentClassDialog } from "./EnrollmentClassDialog";

interface Props {
  enrollments: StudentEnrollment[];
  isLoading: boolean;
  programIds: string[];
  onEnroll: () => void;
  onRemove: (enrollment: StudentEnrollment) => void;
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

  const { data: schoolYears } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const yearNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sy of schoolYears ?? []) {
      map.set(sy.id, sy.name);
    }
    return map;
  }, [schoolYears]);

  const getYearName = (e: StudentEnrollment): string | null => {
    const yearId = e.class?.school_year_id ?? e.school_year_id ?? null;
    if (!yearId) return null;
    return yearNameById.get(yearId) ?? null;
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold not-interactive">Enrollments</h2>
          {!isLoading && (
            <span className="text-xs text-muted-foreground not-interactive">
              ({enrollments.length})
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
      ) : enrollments.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No enrollments yet.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {enrollments.map((e) => {
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
  );
}
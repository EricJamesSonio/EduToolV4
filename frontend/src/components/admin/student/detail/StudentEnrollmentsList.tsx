"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudentEnrollment } from "@/api/admin/student.api";

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
          {enrollments.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {e.class?.subject?.name ?? e.class_id}
                </span>
                <StatusBadge status={e.status} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(e)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
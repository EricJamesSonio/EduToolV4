import { Users, Trash2, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EnrollmentResponse } from "@/api/admin/class.api";

interface EnrolledStudentsListProps {
  enrollments: EnrollmentResponse[];
  isLoading: boolean;
  enrolledCount: number;
  isArchived: boolean;
  onEnroll: () => void;
  onRemove: (target: { enrollmentId: string; studentName: string }) => void;
}

// Prefer student name → student code → truncated UUID (never show full UUID)
function getStudentLabel(enrollment: EnrollmentResponse): string {
  if (enrollment.studentName) return enrollment.studentName;
  if (enrollment.studentCode) return enrollment.studentCode;
  return enrollment.student_id.slice(0, 8) + "…";
}

export function EnrolledStudentsList({
  enrollments,
  isLoading,
  enrolledCount,
  isArchived,
  onEnroll,
  onRemove,
}: EnrolledStudentsListProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Enrolled Students{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({enrolledCount})
          </span>
        </h2>
        {!isArchived && (
          <Button size="sm" onClick={onEnroll}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Enroll Student
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-10 text-center">
          <Users className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          {!isArchived && (
            <button
              onClick={onEnroll}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Enroll the first student
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden divide-y">
          {enrollments.map((enrollment) => {
            const label = getStudentLabel(enrollment);
            return (
              <div
                key={enrollment.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{label}</p>
                  {/* Show student code as subtitle when we also have a full name */}
                  {enrollment.studentName && enrollment.studentCode && (
                    <p className="text-xs text-muted-foreground truncate">
                      {enrollment.studentCode}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={enrollment.status === "active" ? "default" : "secondary"}
                    className="text-xs font-normal capitalize"
                  >
                    {enrollment.status}
                  </Badge>
                  {!isArchived && (
                    <button
                      onClick={() =>
                        onRemove({
                          enrollmentId: enrollment.id,
                          studentName: label,
                        })
                      }
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove student"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
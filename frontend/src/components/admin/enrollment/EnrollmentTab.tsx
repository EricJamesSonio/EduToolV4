"use client";

import { useSchoolYearEnrollments } from "@/hooks/admin/useStudentEnrollment";
import { OrgEnrollmentSettingCard } from "./OrgEnrollmentSettingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen } from "lucide-react";

interface Props {
  schoolYearId: string;
  isEnded:      boolean;
}

export function EnrollmentTab({ schoolYearId, isEnded }: Props) {
  const { data: enrollments = [], isLoading } = useSchoolYearEnrollments(schoolYearId);

  const activeCount   = enrollments.filter((e) => e.status === "active").length;
  const pendingCount  = enrollments.filter((e) => e.status === "pending").length;
  const totalProgEnrollments = enrollments.reduce(
    (sum, e) => sum + (e.programEnrollments?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Settings */}
      <OrgEnrollmentSettingCard />

      {/* Summary cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3 not-interactive">Enrollment Summary</h2>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground not-interactive">Total Students</p>
              <p className="text-2xl font-semibold not-interactive">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground not-interactive">in this school year</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground not-interactive">Active</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400 not-interactive">
                {activeCount}
              </p>
              <p className="text-xs text-muted-foreground not-interactive">
                {pendingCount > 0 ? `${pendingCount} pending` : "no pending"}
              </p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground not-interactive">Program Enrollments</p>
              <p className="text-2xl font-semibold not-interactive">{totalProgEnrollments}</p>
              <p className="text-xs text-muted-foreground not-interactive">across all programs</p>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-6 text-center space-y-2">
        <div className="flex justify-center gap-3 text-muted-foreground/50">
          <BookOpen className="h-8 w-8" />
          <Users className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium text-muted-foreground not-interactive">
          Enroll students from the Programs tab
        </p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto not-interactive">
          Navigate to a program, then drill down to a level or course to view
          and enroll students directly into their academic scope.
        </p>
      </div>
    </div>
  );
}
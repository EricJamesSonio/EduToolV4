// frontend/src/app/student/classes/[classId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassInfoCard } from "@/components/student/class/overview/ClassInfoCard";
import { UpcomingAssessmentsCard } from "@/components/student/class/overview/UpcomingAssessmentsCard";
import { GradeSummaryCard } from "@/components/student/class/overview/GradeSummaryCard";
import { useStudentClass } from "@/hooks/student/useStudentClassess";
import { useStudentAssessments } from "@/hooks/student/useStudentAssessments";
import { useStudentGrades } from "@/hooks/student/useStudentGrades";
import type { StudentAssessmentItem } from "@/api/student/assessment.api";
import type { StudentTermGrade } from "@/api/student/grade.api";

export default function StudentClassDetailPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: classData, isLoading: classLoading } = useStudentClass(classId);
  const { data: assessmentsRaw, isLoading: assessmentsLoading } = useStudentAssessments(classId);
  const { data: gradesRaw, isLoading: gradesLoading } = useStudentGrades(classId);

    const assessments = Array.isArray(assessmentsRaw)
    ? assessmentsRaw
    : (((assessmentsRaw as unknown) as Record<string, unknown>)?.data as StudentAssessmentItem[] ?? []);

    const grades = Array.isArray(gradesRaw)
    ? gradesRaw
    : (((gradesRaw as unknown) as Record<string, unknown>)?.data as StudentTermGrade[] ?? []);

  const subjectName = classData?.class?.subjectName ?? "Class";

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/student/classes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {classLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <h1 className="text-lg font-semibold text-foreground truncate">
            {subjectName}
          </h1>
        )}
      </div>

      {/* Overview content */}
      {classLoading ? (
        <OverviewSkeleton />
      ) : classData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-5">
            <ClassInfoCard data={classData} />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <UpcomingAssessmentsCard
              classId={classId}
              assessments={assessments}
              isLoading={assessmentsLoading}
              onViewAll={() => router.push(`/student/classes/${classId}/assessments`)}
            />
            <GradeSummaryCard
              grades={grades}
              isLoading={gradesLoading}
              onViewAll={() => router.push(`/student/classes/${classId}/grades`)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OverviewSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
      <div className="lg:col-span-2 space-y-5">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
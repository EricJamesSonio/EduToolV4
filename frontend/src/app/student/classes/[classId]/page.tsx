"use client";

import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClassInfoCard } from "@/components/student/class/overview/ClassInfoCard";
import { UpcomingAssessmentsCard } from "@/components/student/class/overview/UpcomingAssessmentsCard";
import { GradeSummaryCard } from "@/components/student/class/overview/GradeSummaryCard";
import { useStudentClass } from "@/hooks/student/useStudentClassess";
import { useStudentAssessments } from "@/hooks/student/useStudentAssessments";
import { useStudentGrades } from "@/hooks/student/useStudentGrades";

export default function StudentClassDetailPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: classData, isLoading: classLoading } = useStudentClass(classId);
  const { data: assessments = [], isLoading: assessmentsLoading } = useStudentAssessments(classId);
  const { data: grades = [], isLoading: gradesLoading } = useStudentGrades(classId);

  const subjectName = classData?.class?.subjectName ?? "Class";

  return (
    <div className="space-y-6">
      <PageHeader
        title={subjectName}
        breadcrumbs={[
          { label: "My Classes", href: "/student/classes" },
          { label: subjectName },
        ]}
      />

      {classLoading ? (
        <OverviewSkeleton />
      ) : classData ? (
        <div className="space-y-6">
          <ClassInfoCard data={classData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

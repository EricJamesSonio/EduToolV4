// frontend/src/app/student/classes/[classId]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassInfoCard } from "@/components/student/class/overview/ClassInfoCard";
import { UpcomingAssessmentsCard } from "@/components/student/class/overview/UpcomingAssessmentsCard";
import { GradeSummaryCard } from "@/components/student/class/overview/GradeSummaryCard";
import { useStudentClass } from "@/hooks/student/useStudentClassess";
import { useStudentAssessments } from "@/hooks/student/useStudentAssessments";
import { useStudentGrades } from "@/hooks/student/useStudentGrades";

type Tab = "overview" | "lessons" | "assessments" | "attendance" | "grades";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview",    label: "Overview"    },
  { value: "lessons",     label: "Lessons"     },
  { value: "assessments", label: "Assessments" },
  { value: "attendance",  label: "Attendance"  },
  { value: "grades",      label: "Grades"      },
];

export default function StudentClassDetailPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: classData, isLoading: classLoading } = useStudentClass(classId);
  const { data: assessmentsRaw, isLoading: assessmentsLoading } = useStudentAssessments(classId);
  const { data: gradesRaw, isLoading: gradesLoading } = useStudentGrades(classId);

  // Normalize envelopes defensively
  const assessments = Array.isArray(assessmentsRaw)
    ? assessmentsRaw
    : ((assessmentsRaw as any)?.data ?? []);

  const grades = Array.isArray(gradesRaw)
    ? gradesRaw
    : ((gradesRaw as any)?.data ?? []);

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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as Tab)}
        className="w-full"
      >
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto gap-0">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground transition-colors"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-5">
          {classLoading ? (
            <OverviewSkeleton />
          ) : classData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left col */}
              <div className="lg:col-span-1 space-y-5">
                <ClassInfoCard data={classData} />
              </div>

              {/* Right col */}
              <div className="lg:col-span-2 space-y-5">
                <UpcomingAssessmentsCard
                  classId={classId}
                  assessments={assessments}
                  isLoading={assessmentsLoading}
                  onViewAll={() => setActiveTab("assessments")}
                />
                <GradeSummaryCard
                  grades={grades}
                  isLoading={gradesLoading}
                  onViewAll={() => setActiveTab("grades")}
                />
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Lessons (placeholder) ── */}
        <TabsContent value="lessons" className="mt-5">
          <ComingSoon label="Lessons" />
        </TabsContent>

        {/* ── Assessments (placeholder) ── */}
        <TabsContent value="assessments" className="mt-5">
          <ComingSoon label="Assessments" />
        </TabsContent>

        {/* ── Attendance (placeholder) ── */}
        <TabsContent value="attendance" className="mt-5">
          <ComingSoon label="Attendance" />
        </TabsContent>

        {/* ── Grades (placeholder) ── */}
        <TabsContent value="grades" className="mt-5">
          <ComingSoon label="Grades" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComingSoon({ label }: { label: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        This section is coming soon
      </p>
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
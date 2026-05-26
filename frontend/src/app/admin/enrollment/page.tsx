"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { EnrolledStudentTable } from "@/components/admin/enrollment/EnrolledStudentTable";
import { ProgramEnrollmentDialog } from "@/components/admin/enrollment/ProgramEnrollmentDialog";
import { OrgEnrollmentSettingCard } from "@/components/admin/enrollment/OrgEnrollmentSettingCard";

import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { useStudents } from "@/hooks/admin/useStudents";
import {
  useSchoolYearEnrollments,
  useUnenrollStudent,
  useEnrollInProgram,
} from "@/hooks/admin/useStudentEnrollment";

import { Plus, Users, BookOpen, UserRoundCheck, Layers, ClipboardList } from "lucide-react";

import type { Student } from "@/types/admin/student.types";
import type {
  StudentSchoolYearEnrollment,
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";

export default function EnrollmentPage() {
  const router = useRouter();

  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [tab, setTab] = useState("enrollments");

  // Program dialog
  const [programTarget, setProgramTarget] = useState<Student | null>(null);

  // ── Data ──────────────────────────────────────────────

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  const {
    data: enrollments = [],
    isLoading: enrollLoading,
  } = useSchoolYearEnrollments(schoolYearId ?? "");

  const { data: allStudents = [] } = useStudents();

  const selectedSchoolYear = schoolYears.find((sy) => sy.id === schoolYearId);

  // ── Student lookup map ──────────────────────────────

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    for (const s of allStudents) map.set(s.id, s);
    return map;
  }, [allStudents]);

  // ── Derived ────────────────────────────────────────────

  const activeCount = enrollments.filter((e) => e.status === "active").length;
  const pendingCount = enrollments.filter((e) => e.status === "pending").length;
  const totalProgramEnrollments = enrollments.reduce(
    (sum, e) => sum + (e.programEnrollments?.length ?? 0),
    0,
  );

  // ── Mutations ─────────────────────────────────────────-

  const unenrollMutation = useUnenrollStudent(schoolYearId ?? "");
  const programEnrollMutation = useEnrollInProgram(schoolYearId ?? "");

  // ── Handlers ───────────────────────────────────────────

  const handleUnenroll = useCallback(
    (enrollment: StudentSchoolYearEnrollment) => {
      if (!schoolYearId) return;
      unenrollMutation.mutate(enrollment.id, {
        onSuccess: () => toast.success("Student unenrolled."),
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { message?: string } } };
          toast.error(e?.response?.data?.message ?? "Failed to unenroll student.");
        },
      });
    },
    [schoolYearId, unenrollMutation],
  );

  const handleAssignProgram = useCallback(
    (enrollment: StudentSchoolYearEnrollment) => {
      const student = studentMap.get(enrollment.student_id);
      if (student) setProgramTarget(student);
    },
    [studentMap],
  );

  const handleProgramConfirm = useCallback(
    (data: EnrollStudentProgramRequest) => {
      if (!programTarget) return;
      programEnrollMutation.mutate(
        { studentId: programTarget.id, data },
        {
          onSuccess: () => {
            toast.success("Program assigned.");
            setProgramTarget(null);
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "Failed to assign program.");
          },
        },
      );
    },
    [programTarget, programEnrollMutation],
  );

  const handleEnrollClick = useCallback(() => {
    if (!schoolYearId) return;
    router.push(`/admin/enrollment/enroll?schoolYearId=${schoolYearId}`);
  }, [schoolYearId, router]);

  const isEnded = selectedSchoolYear?.status === "ended";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Enrollment"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_enrollment" />
          </div>
        }
      />

      <SchoolYearSelector
        schoolYears={schoolYears}
        isLoading={syLoading}
        selectedId={schoolYearId}
        onSelect={setSchoolYearId}
      />

      {schoolYearId && (
        <>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleEnrollClick}
              disabled={isEnded}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Enroll Students
            </Button>
          </div>

          <OrgEnrollmentSettingCard />

          <div>
            {enrollLoading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-semibold">{enrollments.length}</p>
                  <p className="text-xs text-muted-foreground">in this school year</p>
                </div>
                <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    {activeCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount > 0 ? `${pendingCount} pending` : "no pending"}
                  </p>
                </div>
                <div className="rounded-lg border bg-card px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Program Enrollments</p>
                  <p className="text-2xl font-semibold">{totalProgramEnrollments}</p>
                  <p className="text-xs text-muted-foreground">across all programs</p>
                </div>
              </div>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="enrollments">
                <Users className="h-4 w-4 mr-1.5" />
                Enrollments
              </TabsTrigger>
              <TabsTrigger value="pending">
                <UserRoundCheck className="h-4 w-4 mr-1.5" />
                Pending Section
              </TabsTrigger>
              <TabsTrigger value="assignment">
                <ClipboardList className="h-4 w-4 mr-1.5" />
                Section Assignment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="space-y-4 pt-4">
              <EnrolledStudentTable
                enrollments={enrollments}
                isLoading={enrollLoading}
                onUnenroll={handleUnenroll}
                onAssignProgram={handleAssignProgram}
                isUnenrolling={unenrollMutation.isPending}
                studentMap={studentMap}
              />
            </TabsContent>

            <TabsContent value="pending" className="pt-4">
              <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center space-y-2">
                <UserRoundCheck className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Section Assignments
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Students enrolled in a program who haven&apos;t been assigned to a
                  section yet will appear here. You can assign them from this view.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="assignment" className="pt-4">
              <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-12 text-center space-y-2">
                <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  Section Assignment
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Bulk-assign or reassign students to sections across programs and
                  levels. This view helps you manage section rosters efficiently.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!schoolYearId && !syLoading && (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Select a school year to manage enrollments
          </p>
        </div>
      )}

      {programTarget && (
        <ProgramEnrollmentDialog
          open={!!programTarget}
          onClose={() => setProgramTarget(null)}
          student={programTarget}
          schoolYearId={schoolYearId!}
          onConfirm={handleProgramConfirm}
          isLoading={programEnrollMutation.isPending}
        />
      )}
    </div>
  );
}

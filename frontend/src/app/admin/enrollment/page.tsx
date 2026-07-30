// ===== File: frontend\src\app\admin\enrollment\page.tsx =====
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { EnrolledStudentTable } from "@/components/admin/enrollment/EnrolledStudentTable";
import { ProgramEnrollmentDialog } from "@/components/admin/enrollment/ProgramEnrollmentDialog";
import { OrgEnrollmentSettingCard } from "@/components/admin/enrollment/OrgEnrollmentSettingCard";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { useSchoolYears, useSections } from "@/hooks/admin/useSchoolYears";
import { useStudents } from "@/hooks/admin/useStudents";
import {
  useSchoolYearEnrollments,
  useUnenrollStudent,
  useEnrollInProgram,
  useUpdateProgramEnrollment,
} from "@/hooks/admin/useStudentEnrollment";

import { Plus, Users, BookOpen, UserRoundCheck, Layers, ClipboardList, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

import type { Student } from "@/types/admin/student.types";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";

interface PendingSectionRow {
  enrollment: StudentSchoolYearEnrollment;
  pe: ProgramEnrollmentSnapshot;
}

export default function EnrollmentPage() {
  const router = useRouter();

  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [tab, setTab] = useState("enrollments");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Program dialog
  const [programTarget, setProgramTarget] = useState<Student | null>(null);

  // Section assignment per row
  const [sectionAssignments, setSectionAssignments] = useState<Record<string, string>>({});

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

  // ── Pending section data ────────────────────────────

  const pendingSectionEnrollments = useMemo(() => {
    if (!schoolYearId) return [];
    return enrollments.filter((e) =>
      e.programEnrollments.some((pe) => pe.section === null),
    ).map((e) => {
      const pe = e.programEnrollments.find((pe) => pe.section === null);
      return { enrollment: e, pe: pe! };
    });
  }, [enrollments, schoolYearId]);

  const { data: allSections = [] } = useSections(schoolYearId);

  // ── Mutations ─────────────────────────────────────────-

  const unenrollMutation = useUnenrollStudent(schoolYearId ?? "");
  const programEnrollMutation = useEnrollInProgram(schoolYearId ?? "");
  const updateSectionMutation = useUpdateProgramEnrollment(schoolYearId ?? "");

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

  const handleAssignSection = useCallback(
    (programEnrollmentId: string, sectionId: string) => {
      updateSectionMutation.mutate(
        { programEnrollmentId, data: { section_id: sectionId } },
        {
          onSuccess: () => toast.success("Section assigned."),
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "Failed to assign section.");
          },
        },
      );
    },
    [updateSectionMutation],
  );

  const handleEnrollClick = useCallback(() => {
    if (!schoolYearId) return;
    router.push(`/admin/enrollment/enroll?schoolYearId=${schoolYearId}`);
  }, [schoolYearId, router]);

  // ── Pending section columns ─────────────────────────

  const pendingColumns: ColumnDef<PendingSectionRow>[] = useMemo(() => [
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = studentMap.get(row.original.enrollment.student_id);
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {student?.fullName ?? "Unknown Student"}
            </p>
            {student && (
              <p className="text-xs text-muted-foreground truncate">
                {student.studentId}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "programs",
      header: "Programs",
      cell: ({ row }) => {
        const { pe } = row.original;
        return (
          <Badge variant="secondary" className="text-xs font-normal">
            {pe.program.name}
            {pe.course && ` · ${pe.course.code ?? pe.course.name}`}
            {pe.strand && ` · ${pe.strand.name}`}
            {pe.level  && ` · ${pe.level.name}`}
          </Badge>
        );
      },
    },
    {
      id: "section",
      header: "Section",
      cell: ({ row }) => {
        const { pe } = row.original;
        const levelSections = allSections.filter(
          (s) => s.level_id === pe.level?.id,
        );
        const rowSectionId = sectionAssignments[pe.id] ?? "";
        return (
          <div className="flex items-center gap-2">
            <Select
              value={rowSectionId}
              onValueChange={(v) =>
                setSectionAssignments((prev) => ({
                  ...prev,
                  [pe.id]: v ?? "",
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Select section">
                  {(value: string | null) => {
                    if (!value) return null;
                    const s = allSections.find((sec) => sec.id === value);
                    return s?.name ?? value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {levelSections.length === 0 ? (
                  <SelectItem value="__none__" disabled className="text-xs text-muted-foreground">
                    No sections for this level
                  </SelectItem>
                ) : (
                  levelSections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id} className="text-xs">
                      {sec.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              disabled={!rowSectionId || updateSectionMutation.isPending}
              onClick={() => handleAssignSection(pe.id, rowSectionId)}
            >
              Assign
            </Button>
          </div>
        );
      },
    },
  ], [studentMap, allSections, sectionAssignments, updateSectionMutation, handleAssignSection]);

  const isEnded = selectedSchoolYear?.status === "ended";

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Enrollment"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_enrollment" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={schoolYearId}
              onSelect={setSchoolYearId}
            />
          </div>
        }
      />

      {schoolYearId && (
        <>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSettingsOpen((o) => !o)}
              aria-expanded={settingsOpen}
            >
              <Settings className="mr-1.5 h-4 w-4" />
              Settings
              <ChevronDown
                className={cn(
                  "ml-1.5 h-3.5 w-3.5 transition-transform",
                  settingsOpen && "rotate-180"
                )}
              />
            </Button>
            <Button
              size="sm"
              onClick={handleEnrollClick}
              disabled={isEnded}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Enroll Students
            </Button>
          </div>

          {settingsOpen && (
            <div className="animate-fade-in">
              <OrgEnrollmentSettingCard />
            </div>
          )}

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
                  <p className="text-2xl font-semibold not-interactive">{totalProgramEnrollments}</p>
                  <p className="text-xs text-muted-foreground not-interactive">across all programs</p>
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

            <TabsContent value="pending" className="pt-4 space-y-2">
              <p className="text-xs text-muted-foreground px-1">
                Students enrolled in a program who haven&apos;t been assigned to a
                section yet.
              </p>
              <DataTable
                columns={pendingColumns}
                data={pendingSectionEnrollments}
                isLoading={enrollLoading}
                emptyTitle="All students have sections assigned"
                emptyDescription="No pending section assignments for this school year."
                className="rounded-lg border"
              />
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
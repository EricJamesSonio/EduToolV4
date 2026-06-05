"use client";

import { Suspense, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Download, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { studentApi }  from "@/api/admin/student.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import type { Student } from "@/types/admin/student.types";
import type { GetStudentsQuery } from "@/api/admin/student.api";

import { PageHeader }    from "@/components/shared/PageHeader";
import { HelpGuide }     from "@/components/shared/help-guide/HelpGuide";
import { EmptyState }    from "@/components/shared/EmptyState";
import { Skeleton }      from "@/components/ui/skeleton";
import { Button }        from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { StudentFilterBar }    from "@/components/admin/student/StudentFilterBar";
import { StudentTable }        from "@/components/admin/student/StudentTable";
import { CreateStudentDialog } from "@/components/admin/student/CreateStudentDialog";
import { BulkCreateStudentDialog } from "@/components/admin/student/BulkCreateStudentDialog";
import { useOrganization } from "@/hooks/admin/useOrganization";

function StudentsPageInner(): React.JSX.Element {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [filters, setFilters]       = useState<GetStudentsQuery>({});

  const { data: org, isLoading: orgLoading } = useOrganization();
  const hasEmailExtension = !!org?.emailExtension;

  const { data: studentsRaw, isLoading } = useQuery({
    queryKey: ["admin", "students", filters],
    queryFn:  () => studentApi.getAll(filters),
  });

  const students: Student[] = studentsRaw ?? [];

  // ── Active school year ────────────────────────────────────────────────
  const { data: schoolYears } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  const activeSchoolYearId = useMemo(
    () =>
      schoolYears?.find((sy) => sy.status === "active")?.id ??
      schoolYears?.[0]?.id ??
      null,
    [schoolYears],
  );

  // ── School-year enrollments (for program/level/section enrichment) ───
  const { data: schoolYearEnrollments } = useQuery({
    queryKey: ["admin", "school-year-enrollments", activeSchoolYearId],
    queryFn: () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
    enabled: !!activeSchoolYearId,
  });

  // Merge enrollment data into each student row
  const enrichedStudents: Student[] = useMemo(
    () =>
      students.map((s) => {
        const sye = schoolYearEnrollments?.find(
          (e) => e.student_id === s.id,
        );
        if (!sye?.programEnrollments?.length) return s;
        const pe =
          sye.programEnrollments.find((p) => p.status === "active") ??
          sye.programEnrollments[0];
        return {
          ...s,
          programName: pe.program?.name ?? s.programName,
          levelName: pe.level?.name ?? s.levelName,
          sectionName: pe.section?.name ?? s.sectionName,
          courseName: pe.course
            ? pe.course.code
              ? `${pe.course.code} – ${pe.course.name}`
              : pe.course.name
            : s.courseName,
          strandName: pe.strand?.name ?? s.strandName,
        };
      }),
    [students, schoolYearEnrollments],
  );

  const handleDownloadCredentials = () => {
    window.open(studentApi.downloadCredentials(), "_blank");
  };

  const handleSetupEmail = () => {
    router.push("/admin/organization");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_students" />
            <Button variant="outline" size="sm" onClick={handleDownloadCredentials}>
              <Download className="mr-1.5 h-4 w-4" />
              Download Credentials
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/students/import")}
            >
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
              <Users className="mr-1.5 h-4 w-4" />
              Bulk Create
            </Button>

            {/* Email Extension Guard */}
            {!hasEmailExtension ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleSetupEmail}
                disabled={orgLoading}
              >
                <AlertCircle className="mr-1.5 h-4 w-4" />
                Setup Email Extension
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                New Student
              </Button>
            )}
          </div>
        }
      />

      {/* Alert when no email extension */}
      {!hasEmailExtension && !orgLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to set up an email extension before creating students. Go to{" "}
            <button
              onClick={handleSetupEmail}
              className="underline font-semibold hover:opacity-80"
            >
              Organization Settings
            </button>
            {" "}to configure it.
          </AlertDescription>
        </Alert>
      )}

      <StudentFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description={
            hasEmailExtension
              ? "Create your first student or adjust your filters."
              : "Setup email extension first to create students."
          }
          action={
            hasEmailExtension
              ? { label: "New Student", onClick: () => setCreateOpen(true) }
              : { label: "Setup Email Extension", onClick: handleSetupEmail }
          }
        />
      ) : (
        <StudentTable
          data={enrichedStudents}
          onView={(s) => router.push(`/admin/students/${s.id}`)}
        />
      )}

      {createOpen && hasEmailExtension && (
        <CreateStudentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
          }}
        />
      )}

      {bulkOpen && hasEmailExtension && (
        <BulkCreateStudentDialog
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  );
}

export default function StudentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </Suspense>
  );
}
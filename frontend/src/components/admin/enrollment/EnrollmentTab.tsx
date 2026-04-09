"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useSchoolYearEnrollments,
  useEnrollStudent,
  useBulkEnrollStudents,
  useUnenrollStudent,
  useEnrollInProgram,
} from "@/hooks/admin/useStudentEnrollment";
import { EnrolledStudentTable }    from "./EnrolledStudentTable";
import { EnrollStudentDialog }     from "./EnrollStudentDialog";
import { ProgramEnrollmentDialog } from "./ProgramEnrollmentDialog";
import { OrgEnrollmentSettingCard } from "./OrgEnrollmentSettingCard";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { Student } from "@/types/admin/student.types";
import type {
  StudentSchoolYearEnrollment,
  EnrollStudentProgramRequest,
} from "@/types/admin/student-enrollment.types";
import type { AxiosError } from "axios";

interface Props {
  schoolYearId: string;
  isEnded:      boolean;
}

export function EnrollmentTab({ schoolYearId, isEnded }: Props) {
  const [enrollOpen, setEnrollOpen]   = useState(false);
  const [programTarget, setProgramTarget] =
    useState<StudentSchoolYearEnrollment | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: enrollments = [], isLoading } =
    useSchoolYearEnrollments(schoolYearId);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const bulkEnrollMutation  = useBulkEnrollStudents(schoolYearId);
  const unenrollMutation    = useUnenrollStudent(schoolYearId);
  const enrollProgramMutation = useEnrollInProgram(schoolYearId);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEnrollConfirm = (students: Student[]) => {
    if (students.length === 0) return;

    bulkEnrollMutation.mutate(
      { students: students.map((s) => ({ student_id: s.id })) },
      {
        onSuccess: (result) => {
          if (result.enrolled.length > 0) {
            toast.success(
              `${result.enrolled.length} student${result.enrolled.length > 1 ? "s" : ""} enrolled.`,
            );
          }
          if (result.failed.length > 0) {
            result.failed.forEach((f) =>
              toast.error(`Failed to enroll student: ${f.reason}`),
            );
          }
          setEnrollOpen(false);
        },
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to enroll students.");
        },
      },
    );
  };

  const handleUnenroll = (enrollment: StudentSchoolYearEnrollment) => {
    unenrollMutation.mutate(enrollment.id, {
      onSuccess: () => toast.success("Student unenrolled."),
      onError: () => toast.error("Failed to unenroll student."),
    });
  };

  const handleAssignProgram = (
    enrollment: StudentSchoolYearEnrollment,
    data: EnrollStudentProgramRequest,
  ) => {
    enrollProgramMutation.mutate(
      { studentId: enrollment.student_id, data },
      {
        onSuccess: () => {
          toast.success("Program assigned.");
          setProgramTarget(null);
        },
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to assign program.");
        },
      },
    );
  };
const programTargetAsStudent: Student | null = programTarget
  ? {
      id:        programTarget.student_id,
      orgId:     programTarget.org_id,
      fullName:  programTarget.student_id,
      email:     "",
      studentId: programTarget.student_id,
      status:    "active",
      createdAt: "",
    }
  : null;

  return (
    <div className="space-y-6">
      {/* Settings card */}
      <OrgEnrollmentSettingCard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Enrolled Students</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enrollments.length} student{enrollments.length !== 1 ? "s" : ""} in this school year
          </p>
        </div>
        {!isEnded && (
          <Button size="sm" onClick={() => setEnrollOpen(true)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Enroll Students
          </Button>
        )}
      </div>

      {/* Table */}
      <EnrolledStudentTable
        enrollments={enrollments}
        isLoading={isLoading}
        isUnenrolling={unenrollMutation.isPending}
        onUnenroll={handleUnenroll}
        onAssignProgram={(enrollment) => setProgramTarget(enrollment)}
      />

      {/* Enroll dialog */}
      {enrollOpen && (
        <EnrollStudentDialog
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
          alreadyEnrolled={enrollments}
          onConfirm={handleEnrollConfirm}
          isLoading={bulkEnrollMutation.isPending}
        />
      )}

      {/* Program assignment dialog */}
      {programTarget && programTargetAsStudent && (
        <ProgramEnrollmentDialog
          open
          onClose={() => setProgramTarget(null)}
          student={programTargetAsStudent}
          schoolYearId={schoolYearId}
          onConfirm={(data) => handleAssignProgram(programTarget, data)}
          isLoading={enrollProgramMutation.isPending}
        />
      )}
    </div>
  );
}
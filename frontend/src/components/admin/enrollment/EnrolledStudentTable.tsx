"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable }     from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { cn }      from "@/lib/utils";
import { formatDate } from "@/utils/date.util";
import { UserMinus, GraduationCap } from "lucide-react";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import type { Student } from "@/types/admin/student.types";

const STATUS_CLASS: Record<string, string> = {
  active:     "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  pending:    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  unenrolled: "bg-muted text-muted-foreground",
};

interface Props {
  enrollments:   StudentSchoolYearEnrollment[];
  isLoading:     boolean;
  onUnenroll:    (enrollment: StudentSchoolYearEnrollment) => void;
  onAssignProgram: (enrollment: StudentSchoolYearEnrollment) => void;
  isUnenrolling: boolean;
  studentMap?:   Map<string, Student>;
}

export function EnrolledStudentTable({
  enrollments,
  isLoading,
  onUnenroll,
  onAssignProgram,
  isUnenrolling,
  studentMap,
}: Props) {
  const [unenrollTarget, setUnenrollTarget] =
    useState<StudentSchoolYearEnrollment | null>(null);

  const columns: ColumnDef<StudentSchoolYearEnrollment>[] = [
    {
      id: "student",
      header: "Student",
      cell: ({ row }) => {
        const student = studentMap?.get(row.original.student_id);
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate not-interactive">
              {student?.fullName ?? "Unknown Student"}
            </p>
            {student && (
              <p className="text-xs text-muted-foreground truncate not-interactive">
                {student.studentId}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize not-interactive",
            STATUS_CLASS[row.original.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "programs",
      header: "Departments",
      cell: ({ row }) => {
        const progs = row.original.programEnrollments;
        if (!progs?.length) {
          return (
            <span className="text-xs text-muted-foreground italic not-interactive">
              No department assigned
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {progs.map((p) => (
              <Badge key={p.id} variant="secondary" className="text-xs font-normal">
                {p.program.name}
                {p.course && ` · ${p.course.code ?? p.course.name}`}
                {p.strand && ` · ${p.strand.name}`}
                {p.level  && ` · ${p.level.name}`}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "enrolled_at",
      header: "Enrolled",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground not-interactive">
          {formatDate(row.original.enrolled_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isUnenrolled = row.original.status === "unenrolled";
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => onAssignProgram(row.original)}
              disabled={isUnenrolled}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Department
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
              disabled={isUnenrolled}
              onClick={() => setUnenrollTarget(row.original)}
            >
              <UserMinus className="h-3.5 w-3.5" />
              Unenroll
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        emptyTitle="No students enrolled"
        emptyDescription="Enroll students into this school year to get started."
      />

      {unenrollTarget && (
        <ConfirmDialog
          open
          title="Unenroll this student?"
          message={`Remove this student from the school year? Their class-level enrollments will not be affected.`}
          confirmLabel="Unenroll"
          destructive
          isLoading={isUnenrolling}
          onConfirm={() => onUnenroll(unenrollTarget)}
          onOpenChange={(o) => { if (!o) setUnenrollTarget(null); }}
        />
      )}
    </>
  );
}
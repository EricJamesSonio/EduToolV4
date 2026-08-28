"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/types/admin/student.types";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

interface StudentTableProps {
  data: Student[];
  onView: (student: Student) => void;
  onResetPassword: (student: Student) => void;
  warningStudentIds?: Set<string>;
}

export function StudentTable({ data, onView, onResetPassword, warningStudentIds }: StudentTableProps): React.JSX.Element {
  const columns: ColumnDef<Student>[] = [
    {
      header: "",
      id: "avatar",
      cell: ({ row }) => (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={getProfileImageUrl(row.original.profileImage)}
            alt={row.original.fullName}
          />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {getInitials(row.original.fullName)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      header: "Full Name",
      accessorKey: "fullName",
      cell: ({ row, getValue }) => {
        const hasWarning = warningStudentIds?.has(row.original.id);
        return (
          <span className="font-medium not-interactive inline-flex items-center gap-1.5">
            {getValue<string>() ?? "—"}
            {hasWarning && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 text-amber-700 bg-amber-50 px-1.5 py-0">
                <AlertTriangle className="h-3 w-3" />
                Prereq
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      header: "Student ID",
      accessorKey: "studentId",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground font-mono not-interactive">
          {getValue<string>() ?? "—"}
        </span>
      ),
    },
    {
      header: "Department",
      accessorFn: (row) => row.programName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Level",
      accessorFn: (row) => row.levelName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Course / Strand",
      accessorFn: (row) => row.courseName ?? row.strandName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Section",
      accessorFn: (row) => row.sectionName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => onView(row.original)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => onResetPassword(row.original)}
          >
            <KeyRound className="h-3.5 w-3.5" />
            Reset Password
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
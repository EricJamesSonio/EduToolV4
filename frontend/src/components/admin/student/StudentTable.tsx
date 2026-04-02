"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Student } from "@/types/admin/student.types";

type EnrichedStudent = Student & {
  levelName?: string;
  sectionName?: string;
};

interface StudentTableProps {
  data: EnrichedStudent[];
  onView: (student: EnrichedStudent) => void;
}

export function StudentTable({ data, onView }: StudentTableProps): React.JSX.Element {
  const columns: ColumnDef<EnrichedStudent>[] = [
    {
      header: "Full Name",
      accessorKey: "fullName",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>() ?? "—"}</span>
      ),
    },
    {
      header: "Student ID",
      accessorKey: "studentId",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {getValue<string>() ?? "—"}
        </span>
      ),
    },
    {
      header: "Level",
      accessorFn: (row) => row.levelName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      header: "Section",
      accessorFn: (row) => row.sectionName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue<string>()}</span>
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
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onView(row.original)}
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
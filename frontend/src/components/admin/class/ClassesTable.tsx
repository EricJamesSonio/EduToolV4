"use client";
import { useRouter } from "next/navigation";
import { Eye, Archive } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import type { Class } from "@/types/admin/class.types";
import { formatSchedule } from "@/utils/classes.utils";

interface ClassesTableProps {
  data: Class[];
  onArchive: (row: Class) => void;
}

export function ClassesTable({ data, onArchive }: ClassesTableProps): React.JSX.Element {
  const router = useRouter();

  const columns: ColumnDef<Class>[] = [
    {
      header: "Title",
      accessorFn: (row) => row.title ?? row.subjectName ?? row.subjectId,
      cell: ({ getValue }) => (
        <span className="font-medium not-interactive">{getValue<string>()}</span>
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
      header: "Semester",
      accessorFn: (row) => row.semesterName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Educator",
      accessorFn: (row) => row.educatorName ?? "—",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground not-interactive">{getValue<string>()}</span>
      ),
    },
    {
      header: "Schedule",
      accessorFn: (row) => formatSchedule(row.schedules),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground tabular-nums not-interactive">
          {getValue<string>()}
        </span>
      ),
    },
    {
      header: "Enrolled",
      accessorFn: (row) => row.enrolledCount ?? 0,
      cell: ({ row }) => {
        const cls = row.original;
        const count = cls.enrolledCount ?? 0;
        const pct = Math.min((count / cls.capacity) * 100, 100);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums not-interactive">
              {count} / {cls.capacity}
            </span>
            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => router.push(`/admin/classes/${cls.id}`)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
            {!cls.isArchived ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onArchive(cls)}
              >
                <Archive className="mr-1 h-3.5 w-3.5" />
                Archive
              </Button>
            ) : (
              <Badge variant="secondary" className="text-xs font-normal not-interactive">
                Archived
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
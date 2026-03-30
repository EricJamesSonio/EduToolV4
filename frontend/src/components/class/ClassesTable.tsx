"use client";

import { useRouter } from "next/navigation";
import { Eye, Archive } from "lucide-react";
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

  const columns = [
    {
      header: "Title",
      accessor: (row: Class) => (
        <span className="font-medium">{row.title ?? "Unnamed"}</span>
      ),
    },
    {
      header: "Section",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">{row.sectionName ?? "—"}</span>
      ),
    },
    {
      header: "Semester",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">{row.semesterName ?? "—"}</span>
      ),
    },
    {
      header: "Educator",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">{row.educatorName ?? "—"}</span>
      ),
    },
    {
      header: "Schedule",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatSchedule(row.schedules)}
        </span>
      ),
    },
    {
      header: "Enrolled",
      accessor: (row: Class) => (
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">
            {row.enrolledCount ?? 0} / {row.capacity}
          </span>
          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(((row.enrolledCount ?? 0) / row.capacity) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Class) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => router.push(`/admin/classes/${row.id}`)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>

          {!row.isArchived ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onArchive(row)}
            >
              <Archive className="mr-1 h-3.5 w-3.5" />
              Archive
            </Button>
          ) : (
            <Badge variant="secondary" className="text-xs font-normal">
              Archived
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
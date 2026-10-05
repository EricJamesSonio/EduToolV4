"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RowActions, RowActionButton } from "@/components/shared/RowActions";
import type { Subject } from "@/types/admin/subject.types";

function formatArchivedDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function useArchivedSubjectColumns(
  onRestore: (subject: Subject) => void,
): ColumnDef<Subject>[] {
  return [
    {
      header: "Title",
      accessorKey: "title",
      cell: (info) => (
        <span className="font-medium">{info.getValue<string>()}</span>
      ),
    },
    {
      header: "Department",
      accessorKey: "programName",
      cell: (info) => (
        <span className="text-sm">{info.getValue<string>()}</span>
      ),
    },
    {
      header: "Type",
      accessorKey: "subjectType",
      cell: (info) => (
        <Badge variant="outline" className="text-xs border px-2 py-0.5 font-normal capitalize">
          {info.getValue<string>()}
        </Badge>
      ),
    },
    {
      header: "Archived",
      accessorKey: "deletedAt",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {formatArchivedDate(info.getValue<string | null>())}
        </span>
      ),
    },
    {
      header: "Classes",
      accessorKey: "classCount",
      cell: (info) => {
        const count = info.getValue<number | null>() ?? 0;
        return (
          <span className="text-sm">
            {count} {count === 1 ? "class" : "classes"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: (info) => {
        const row = info.row.original;
        return (
          <RowActions>
            <RowActionButton
              icon={RotateCcw}
              label="Restore"
              onClick={() => onRestore(row)}
            />
          </RowActions>
        );
      },
    },
  ];
}

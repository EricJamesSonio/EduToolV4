// app/admin/subjects/_components/SubjectColumns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RowActions, RowActionButton } from "@/components/shared/RowActions";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { Subject } from "@/types/admin/subject.types";

export function useSubjectColumns(
  onEdit: (subject: Subject) => void,
  onLock: (subject: Subject) => void,
  onUnlock: (subject: Subject) => void,
  onDelete?: (subject: Subject) => void,
): ColumnDef<Subject>[] {
  const router = useRouter();

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
      header: "Course / Strand",
      cell: (info) => {
        const row = info.row.original;
        const name = row.courseName ?? row.strandName;
        if (!name) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <Badge
            variant="outline"
            className="text-xs border px-2 py-0.5 font-normal"
          >
            {name}
          </Badge>
        );
      },
    },
    {
      header: "Level",
      accessorKey: "levelName",
      cell: (info) => {
        const name = info.getValue<string | null>();
        if (!name) return <span className="text-sm text-muted-foreground">—</span>;
        const match = name.match(/^(\d+)/);
        const idx = match ? (parseInt(match[1]) - 1) % WEEK_COLORS.length : 0;
        return (
          <Badge
            variant="outline"
            className={cn("text-xs border px-2 py-0.5 font-normal", WEEK_COLORS[idx])}
          >
            {name}
          </Badge>
        );
      },
    },

    {
      header: "Actions",
      cell: (info) => {
        const row = info.row.original;
        const locked = row.lockStatus === "locked";
        return (
          <RowActions>
            <RowActionButton
              icon={Pencil}
              label="Edit"
              disabled={locked}
              onClick={() => onEdit(row)}
            />
            <RowActionButton
              icon={Eye}
              label="View"
              onClick={() => router.push(`/admin/subjects/${row.id}`)}
            />
            {locked ? (
              <RowActionButton
                icon={LockOpen}
                label="Unlock"
                onClick={() => onUnlock(row)}
              />
            ) : (
              <RowActionButton
                icon={Lock}
                label="Lock"
                onClick={() => onLock(row)}
              />
            )}
            {onDelete && (
              <RowActionButton
                icon={Trash2}
                label="Delete"
                destructive
                onClick={() => onDelete(row)}
              />
            )}
          </RowActions>
        );
      },
    },
  ];
}
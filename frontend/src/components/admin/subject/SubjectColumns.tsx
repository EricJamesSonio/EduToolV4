// app/admin/subjects/_components/SubjectColumns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { Subject } from "@/types/admin/subject.types";

export function useSubjectColumns(
  onEdit: (subject: Subject) => void,
  onLock: (subject: Subject) => void,
  onUnlock: (subject: Subject) => void
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
      header: "Lock Status",
      accessorKey: "lockStatus",
      cell: (info) => {
        const status = info.getValue<string>();
        const locked = status === "locked";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
              locked
                ? "bg-muted text-muted-foreground"
                : "badge-success"
            )}
          >
            {locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
            {locked ? "Locked" : "Unlocked"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      cell: (info) => {
        const row = info.row.original;
        const locked = row.lockStatus === "locked";
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              disabled={locked}
              onClick={() => onEdit(row)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => router.push(`/admin/subjects/${row.id}`)}
            >
              <Eye className="mr-1 h-3.5 w-3.5" /> View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => (locked ? onUnlock(row) : onLock(row))}
            >
              {locked
                ? <><LockOpen className="mr-1 h-3.5 w-3.5" /> Unlock</>
                : <><Lock className="mr-1 h-3.5 w-3.5" /> Lock</>}
            </Button>
          </div>
        );
      },
    },
  ];
}
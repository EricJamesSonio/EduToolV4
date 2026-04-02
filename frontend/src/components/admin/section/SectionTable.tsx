// filepath: app/admin/sections/_components/SectionTable.tsx

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Section } from "@/types/admin/section.types";

interface SectionTableProps {
  sections: Section[];
  levelMap: Record<string, { name: string; programName: string }>;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
}

export function SectionTable({
  sections,
  levelMap,
  onEdit,
  onDelete,
}: SectionTableProps): React.JSX.Element {
  const columns: ColumnDef<Section>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      header: "Level",
      id: "level",
      cell: ({ row }) => {
        const info = levelMap[row.original.level_id];
        if (!info) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant="secondary" className="font-normal w-fit">
              {info.name}
            </Badge>
            {info.programName && (
              <span className="text-xs text-muted-foreground">{info.programName}</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue<number>()}</span>
      ),
    },
    {
      header: "Students",
      id: "students",
      cell: ({ row }) => {
        const s = row.original;
        const count = s.studentCount ?? 0;
        const pct = Math.min((count / s.capacity) * 100, 100);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums">
              {count} / {s.capacity}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
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
        const s = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(s)}
              title="Edit section"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(s)}
              title="Delete section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={sections} />;
}
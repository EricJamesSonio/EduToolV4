"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button }    from "@/components/ui/button";
import { Badge }     from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Section } from "@/types/admin/section.types";
import type { Program } from "@/types/admin/program.types";

interface SectionTableProps {
  sections: Section[];
  levelMap: Record<string, { name: string; programName: string; programId: string }>;
  programs: Program[];
  onEdit:   (section: Section) => void;
  onDelete: (section: Section) => void;
}

export function SectionTable({
  sections,
  levelMap,
  programs,
  onEdit,
  onDelete,
}: SectionTableProps): React.JSX.Element {

  // Build lookup maps from programs
  const courseMap = Object.fromEntries(
    programs.flatMap((p) =>
      (p.courses ?? []).map((c) => [
        c.id,
        { name: c.name, code: c.code, programName: p.name },
      ])
    )
  );
  const strandMap = Object.fromEntries(
    programs.flatMap((p) =>
      (p.strands ?? []).map((s) => [
        s.id,
        { name: s.name, programName: p.name },
      ])
    )
  );

  const columns: ColumnDef<Section>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      header: "Program / Course / Level",
      id: "context",
      cell: ({ row }) => {
        const s        = row.original;
        const levelInfo = levelMap[s.level_id];
        const course   = s.course_id ? courseMap[s.course_id] : null;
        const strand   = s.strand_id ? strandMap[s.strand_id] : null;

        if (!levelInfo) {
          return <span className="text-muted-foreground text-xs">—</span>;
        }

        return (
          <div className="flex flex-col gap-0.5">
            {/* Program */}
            <span className="text-xs text-muted-foreground">
              {levelInfo.programName}
            </span>

            {/* Course or Strand */}
            {course && (
              <span className="text-xs text-muted-foreground">
                {course.code ? `${course.code} – ${course.name}` : course.name}
              </span>
            )}
            {strand && (
              <span className="text-xs text-muted-foreground">
                {strand.name}
              </span>
            )}

            {/* Level */}
            <Badge variant="secondary" className="font-normal w-fit text-xs">
              {levelInfo.name}
            </Badge>
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
        const s     = row.original;
        const count = s.studentCount ?? 0;
        const pct   = Math.min((count / s.capacity) * 100, 100);
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
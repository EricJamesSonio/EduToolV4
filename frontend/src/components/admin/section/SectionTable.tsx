"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import type { Section } from "@/types/admin/section.types";
import type { Program } from "@/types/admin/program.types";

interface SectionTableProps {
  sections: Section[];
  levelMap: Record<
    string,
    { name: string; programName: string; programId: string }
  >;
  programs: Program[];
  onView: (section: Section) => void;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
}

export function SectionTable({
  sections,
  levelMap,
  programs,
  onView,
  onEdit,
  onDelete,
}: SectionTableProps): React.JSX.Element {
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

  const programTypeMap = Object.fromEntries(
    programs.map((p) => [p.id, p.type])
  );

  const columns: ColumnDef<Section>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <button
          onClick={() => onView(row.original)}
          className="font-medium text-left hover:text-primary hover:underline transition-colors not-interactive"
          title="View section details"
        >
          {row.original.name}
        </button>
      ),
    },
    {
      header: "Department / Course / Level",
      id: "context",
      cell: ({ row }) => {
        const section = row.original;
        const levelInfo = levelMap[section.level_id];
        const course = section.course_id ? courseMap[section.course_id] : null;
        const strand = section.strand_id ? strandMap[section.strand_id] : null;

        if (!levelInfo) {
          return <span className="text-muted-foreground text-xs not-interactive">—</span>;
        }

        const programType = programTypeMap[levelInfo.programId];
        const programColor =
          PROGRAM_TYPE_COLORS[
            programType as keyof typeof PROGRAM_TYPE_COLORS
          ] ?? "bg-slate-500/10 text-slate-600 border-slate-200";

        return (
          <div className="flex flex-col gap-0.5">
            <Badge
              variant="outline"
              className={cn(
                "text-xs border px-2 py-0.5 w-fit font-normal not-interactive",
                programColor
              )}
            >
              {levelInfo.programName}
            </Badge>

            {course && (
              <span className="text-xs text-muted-foreground not-interactive">
                {course.code ? `${course.code} – ${course.name}` : course.name}
              </span>
            )}

            {strand && (
              <span className="text-xs text-muted-foreground not-interactive">
                {strand.name}
              </span>
            )}

            <Badge
              variant="outline"
              className={cn(
                "text-xs border px-2 py-0.5 w-fit font-normal not-interactive",
                (() => {
                  const match = levelInfo.name.match(/^(\d+)/);
                  const idx = match ? (parseInt(match[1]) - 1) % WEEK_COLORS.length : 0;
                  return WEEK_COLORS[idx];
                })()
              )}
            >
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
        <span className="text-sm not-interactive">{getValue<number>()}</span>
      ),
    },
    {
      header: "Students",
      id: "students",
      cell: ({ row }) => {
        const section = row.original;
        const count = section.studentCount ?? 0;
        const pct = Math.min((count / section.capacity) * 100, 100);

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums not-interactive">
              {count} / {section.capacity}
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
        const section = row.original;

        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onView(section)}
              title="View section details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(section)}
              title="Edit section"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(section)}
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
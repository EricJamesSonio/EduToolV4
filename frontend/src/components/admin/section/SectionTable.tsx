"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { RowActions, RowActionButton } from "@/components/shared/RowActions";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
          ] ?? "badge-muted";

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
              variant="secondary"
              className="text-xs px-2 py-0.5 w-fit font-normal not-interactive"
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
          <RowActions>
            <RowActionButton icon={Pencil} label="Edit" onClick={() => onEdit(section)} />
            <RowActionButton icon={Eye} label="View" onClick={() => onView(section)} />
            <RowActionButton
              icon={Trash2}
              label="Delete"
              destructive
              onClick={() => onDelete(section)}
            />
          </RowActions>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={sections} />;
}
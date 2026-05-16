// ===== File: frontend/src/components/admin/semester-settings/ProgramAssignmentTable.tsx =====
"use client";

import { useMemo } from "react";
import { AlertCircle, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/shared/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROGRAM_TYPE_LABELS,
  PROGRAM_TYPE_COLORS,
} from "./constants";
import type { SemesterTemplate, TemplateAssignment } from "@/types/admin/semester-template.types";
import type { ProgramType } from "@/types/admin/semester-template.types";

interface Program {
  id: string;
  name: string;
  type: string;
  school_year_id: string;
  semesterAssignment: TemplateAssignment | null;
}

interface ProgramAssignmentTableProps {
  programs: Program[];
  templates: SemesterTemplate[];
  schoolYearStart: string | null;
  schoolYearEnd: string | null;
  isLoading: boolean;
  onAssignmentChange?: (programId: string, templateId: string | null) => void;
}

export function ProgramAssignmentTable({
  programs,
  templates,
  schoolYearStart,
  schoolYearEnd,
  isLoading,
  onAssignmentChange,
}: ProgramAssignmentTableProps): React.JSX.Element {
  const programsByType = useMemo(() => {
    const map = new Map<string, Program[]>();
    for (const p of programs) {
      const arr = map.get(p.type) ?? [];
      arr.push(p);
      map.set(p.type, arr);
    }
    return map;
  }, [programs]);

  const templatesByType = useMemo(() => {
    const map = new Map<string, SemesterTemplate[]>();
    for (const t of templates) {
      const arr = map.get(t.program_type) ?? [];
      arr.push(t);
      map.set(t.program_type, arr);
    }
    return map;
  }, [templates]);

  const programTypes = useMemo(
    () => Array.from(programsByType.keys()).sort(),
    [programsByType]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 w-full animate-pulse rounded bg-muted"
          />
        ))}
      </div>
    );
  }

  if (programTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No programs found for this school year.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {programTypes.map((type) => {
        const typePrograms = programsByType.get(type) ?? [];
        const compatibleTemplates = templatesByType.get(type) ?? [];
        const typeColor =
          PROGRAM_TYPE_COLORS[type as ProgramType] ??
          "bg-gray-100 text-gray-600 border-gray-200";

        // Build table data
        const tableData = typePrograms.map((p) => ({
          id: p.id,
          name: p.name,
          assignedTemplate: p.semesterAssignment
            ? templates.find((t) => t.id === p.semesterAssignment?.template_id)?.name ?? "Unknown"
            : null,
          templateId: p.semesterAssignment?.template_id ?? "",
        }));

        // Define columns
        const columns = [
          {
            accessorKey: "name",
            header: "Program",
            size: 300,
          },
          {
            id: "template",
            header: "Semester Template",
            cell: ({ row }: any) => {
              const prog = programs.find((p) => p.id === row.original.id);
              if (!prog) return null;

              return (
                <div className="flex items-center gap-2">
                  <Select
                    value={
                      prog.semesterAssignment?.template_id ?? ""
                    }
                    onValueChange={(templateId) => {
                      onAssignmentChange?.(prog.id, templateId || null);
                    }}
                  >
                    <SelectTrigger className="h-8 w-56 text-xs">
                      <SelectValue placeholder="Select template…">
                        {prog.semesterAssignment
                          ? templates.find(
                              (t) => t.id === prog.semesterAssignment?.template_id
                            )?.name ?? "Unknown"
                          : "Select template…"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleTemplates.length === 0 ? (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No templates for this program type
                        </div>
                      ) : (
                        compatibleTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {prog.semesterAssignment && (
                    <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  )}
                </div>
              );
            },
          },
          {
            id: "dates",
            header: "Configure Dates",
            cell: ({ row }: any) => (
              <button className="text-xs px-2 py-1 rounded border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                Edit Dates
              </button>
            ),
          },
        ];

        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs border px-2 py-0.5", typeColor)}
              >
                {PROGRAM_TYPE_LABELS[type as ProgramType] ?? type}
              </Badge>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden">
              <DataTable
                columns={columns}
                data={tableData}
                isLoading={false}
                emptyTitle="No programs"
                emptyDescription="No programs found for this type."
              />
            </div>

            {/* Warning for unassigned */}
            {typePrograms.some((p) => !p.semesterAssignment) && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700">
                  Some programs don&apos;t have a template assigned yet.
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
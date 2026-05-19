// ===== File: frontend/src/components/admin/semester-settings/ProgramAssignmentTable.tsx =====
"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertCircle, AlertTriangle, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { TermDatesModal } from "./TermDatesModal";
import { useProgramCalendarQuery } from "./assign-row/use-program-calendar-query";
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
}

function ProgramTableRowActions({
  program,
  templates,
  onAssign,
}: {
  program: Program;
  templates: SemesterTemplate[];
  onAssign: (program: Program, templateId: string) => void;
}) {
  const { hasNoCalendar, matchingTemplates } = useProgramCalendarQuery(program, templates);
  const [selectedId, setSelectedId] = useState(program.semesterAssignment?.template_id ?? "none")

  if (hasNoCalendar) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 shrink-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Calendar
        </Badge>
        <span className="text-[10px] text-muted-foreground">Set up calendar first</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedId}
        onValueChange={(value) => {
          setSelectedId(value)
          if (value !== "none") {
            onAssign(program, value)
          }
        }}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="Assign template…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— None —</SelectItem>
          {matchingTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-xs">
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {program.semesterAssignment && (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1 shrink-0"
          onClick={() => onAssign(program, program.semesterAssignment!.template_id)}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Dates
        </Button>
      )}
    </div>
  )
}

export function ProgramAssignmentTable({
  programs,
  templates,
  schoolYearStart,
  schoolYearEnd,
  isLoading,
}: ProgramAssignmentTableProps): React.JSX.Element {
  // ================= STATE =================
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProgram, setModalProgram] = useState<Program | null>(null)
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | null>(null)

  // ================= COMPUTED =================
  const programsByType = useMemo(() => {
    const map = new Map<string, Program[]>();
    for (const p of programs) {
      const arr = map.get(p.type) ?? [];
      arr.push(p);
      map.set(p.type, arr);
    }
    return map;
  }, [programs]);

  const programTypes = useMemo(
    () => Array.from(programsByType.keys()).sort(),
    [programsByType]
  );

  // ================= HANDLERS =================
  const handleAssign = useCallback((program: Program, templateId?: string) => {
    setPreselectedTemplateId(templateId ?? null)
    setModalProgram(program)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback((open: boolean) => {
    setModalOpen(open)
    if (!open) {
      // Reset on close so next open re-initializes
      setPreselectedTemplateId(null)
    }
  }, [])

  // ================= RENDER =================
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
    <>
      <div className="space-y-6">
        {programTypes.map((type) => {
          const typePrograms = programsByType.get(type) ?? [];
          const typeColor =
            PROGRAM_TYPE_COLORS[type as ProgramType] ??
            "bg-gray-100 text-gray-600 border-gray-200";

          const tableData = typePrograms.map((p) => ({
            id: p.id,
            name: p.name,
            hasAssignment: !!p.semesterAssignment,
          }));

          const columns = [
            {
              accessorKey: "name",
              header: "Program",
              cell: ({ row }: any) => {
                const prog = programs.find((p) => p.id === row.original.id);
                if (!prog) return null;

                return (
                  <div className="flex items-center gap-3">
                    {prog.semesterAssignment ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{prog.name}</span>
                  </div>
                );
              },
            },
            {
              id: "template",
              header: "Template",
              cell: ({ row }: any) => {
                const prog = programs.find((p) => p.id === row.original.id);
                if (!prog) return null;

                return (
                  <ProgramTableRowActions
                    program={prog}
                    templates={templates}
                    onAssign={handleAssign}
                  />
                );
              },
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

              <div className="rounded-lg border overflow-hidden">
                <DataTable
                  columns={columns}
                  data={tableData}
                  isLoading={false}
                  emptyTitle="No programs"
                  emptyDescription="No programs found for this type."
                />
              </div>

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

      {/* Term Dates Modal */}
      {modalProgram && (
        <TermDatesModal
          open={modalOpen}
          onOpenChange={handleCloseModal}
          program={modalProgram}
          templates={templates}
          schoolYearStart={schoolYearStart}
          schoolYearEnd={schoolYearEnd}
          preselectedTemplateId={preselectedTemplateId}
        />
      )}
    </>
  );
}
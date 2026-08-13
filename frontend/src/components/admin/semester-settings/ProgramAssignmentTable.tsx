// ===== File: frontend/src/components/admin/semester-settings/ProgramAssignmentTable.tsx =====
"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
const DOT_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500"];
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { TermDatesModal } from "./TermDatesModal";
import { ConfirmDialog } from "./assign-row/confirm-dialog";
import { useProgramCalendarQuery } from "./assign-row/use-program-calendar-query";
import { useRemoveTemplateAssignment } from "@/hooks/admin/useSemesterTemplate";
import { errMsg } from "./assign-row/helpers";
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
  schoolYearStarted: boolean;
  isLoading: boolean;
}

function ProgramTableRowActions({
  program,
  templates,
  schoolYearStarted,
  onAssign,
}: {
  program: Program;
  templates: SemesterTemplate[];
  schoolYearStarted: boolean;
  onAssign: (program: Program, templateId: string) => void;
}) {
  const { hasNoCalendar, matchingTemplates } = useProgramCalendarQuery(program, templates);
  const removeMutation = useRemoveTemplateAssignment();
  const [selectedId, setSelectedId] = useState(program.semesterAssignment?.template_id ?? "none")
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)

  if (hasNoCalendar) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 shrink-0">
          <AlertTriangle className="h-3 w-3 mr-1" />
          No Calendar
        </Badge>
        <span className="text-[10px] text-muted-foreground not-interactive">Set up calendar first</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          value={selectedId}
          onValueChange={(value) => {
            if (value === null) return;
            setSelectedId(value)
            if (value === "none") {
              if (schoolYearStarted) return
              setRemoveConfirmOpen(true)
            } else {
              onAssign(program, value)
            }
          }}
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="Assign template…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" disabled={schoolYearStarted}>
              — None —
            </SelectItem>
            {matchingTemplates.map((t, i) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full shrink-0", DOT_COLORS[i % DOT_COLORS.length])} />
                  {t.name}
                </div>
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

      <ConfirmDialog
        open={removeConfirmOpen}
        title="Remove template assignment?"
        description="This will remove the current template assignment and all configured term dates for this department."
        confirmLabel="Yes, remove"
        onConfirm={() => {
          setRemoveConfirmOpen(false)
          removeMutation.mutate(program.id, {
            onSuccess: () => {
              toast.success("Assignment removed.")
            },
            onError: (e) => {
              toast.error(errMsg(e))
              setSelectedId(program.semesterAssignment?.template_id ?? "none")
            },
          })
        }}
        onCancel={() => {
          setRemoveConfirmOpen(false)
          setSelectedId(program.semesterAssignment?.template_id ?? "none")
        }}
      />
    </>
  )
}

export function ProgramAssignmentTable({
  programs,
  templates,
  schoolYearStart,
  schoolYearEnd,
  schoolYearStarted,
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
      <p className="text-sm text-muted-foreground not-interactive">
        No departments found for this school year.
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
              header: "Department",
              cell: ({ row }: { row: { original: { id: string } } }) => {
                const prog = programs.find((p) => p.id === row.original.id);
                if (!prog) return null;

                return (
                  <div className="flex items-center gap-3 min-w-0">
                    {prog.semesterAssignment ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate not-interactive">{prog.name}</span>
                  </div>
                );
              },
            },
            {
              id: "template",
              header: "Template",
              size: 340,
              cell: ({ row }: { row: { original: { id: string } } }) => {
                const prog = programs.find((p) => p.id === row.original.id);
                if (!prog) return null;

                return (
                  <ProgramTableRowActions
                    program={prog}
                    templates={templates}
                    schoolYearStarted={schoolYearStarted}
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
                  className={cn("text-xs border px-2 py-0.5 not-interactive", typeColor)}
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
                  emptyTitle="No departments"
                  emptyDescription="No departments found for this type."
                />
              </div>

              {typePrograms.some((p) => !p.semesterAssignment) && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 not-interactive">
                    Some departments don&apos;t have a template assigned yet.
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
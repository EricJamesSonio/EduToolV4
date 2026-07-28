// frontend/src/components/admin/grading-scheme-template/TemplateAssignmentPanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { PROGRAM_TYPE_COLORS, PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApplyTemplateToClass,
  useApplyTemplateToProgram,
} from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface ClassInfo {
  id: string;
  name: string;
  programId?: string;
}

interface ProgramInfo {
  id: string;
  name: string;
  type: string;
  classes: ClassInfo[];
}

interface TemplateAssignmentPanelProps {
  programs: ProgramInfo[];
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
}

interface PendingProgramApply {
  programId: string;
  programName: string;
  templateId: string;
  templateName: string;
  classCount: number;
}

export function TemplateAssignmentPanel({
  programs,
  templates,
  isLoading,
}: TemplateAssignmentPanelProps) {
  const [selectedMode, setSelectedMode] = useState<"program" | "class">("program");

  const [programTemplates, setProgramTemplates] = useState<Record<string, string>>({});
  const [classTemplates, setClassTemplates] = useState<Record<string, string>>({});

  const [appliedPrograms, setAppliedPrograms] = useState<Set<string>>(new Set());
  const [appliedClasses, setAppliedClasses] = useState<Set<string>>(new Set());

  const [pendingApply, setPendingApply] = useState<PendingProgramApply | null>(null);

  const applyToProgram = useApplyTemplateToProgram();
  const applyToClass = useApplyTemplateToClass();
  const isPending = applyToProgram.isPending || applyToClass.isPending;

  const getTemplateName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? id;

  const handleProgramTemplateSelect = (prog: ProgramInfo, templateId: string) => {
    setProgramTemplates((prev) => ({ ...prev, [prog.id]: templateId }));
    setPendingApply({
      programId: prog.id,
      programName: prog.name,
      templateId,
      templateName: getTemplateName(templateId),
      classCount: prog.classes.length,
    });
  };

  useEffect(() => {
    if (selectedMode !== "class") return;
    setClassTemplates((prev) => {
      const next = { ...prev };
      programs.forEach((prog) => {
        const progTemplateId = programTemplates[prog.id];
        if (!progTemplateId) return;
        prog.classes.forEach((cls) => {
          if (!next[cls.id]) {
            next[cls.id] = progTemplateId;
          }
        });
      });
      return next;
    });
  }, [selectedMode, programs, programTemplates]);

  const confirmApplyToProgram = () => {
    if (!pendingApply) return;
    applyToProgram.mutate(
      { programId: pendingApply.programId, templateId: pendingApply.templateId },
      {
        onSuccess: (res) => {
          const count = res.appliedCount ?? 0;
          toast.success(`Applied "${pendingApply.templateName}" to ${count} classes.`);
          setAppliedPrograms((prev) => new Set(prev).add(pendingApply.programId));

          const prog = programs.find((p) => p.id === pendingApply.programId);
          if (prog) {
            setClassTemplates((prev) => {
              const next = { ...prev };
              prog.classes.forEach((cls) => {
                next[cls.id] = pendingApply.templateId;
              });
              return next;
            });
            setAppliedClasses((prev) => {
              const next = new Set(prev);
              prog.classes.forEach((cls) => next.add(cls.id));
              return next;
            });
          }
          setPendingApply(null);
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply.");
          setProgramTemplates((prev) => ({ ...prev, [pendingApply.programId]: "" }));
          setPendingApply(null);
        },
      }
    );
  };

  const handleApplyToClass = (cls: ClassInfo, templateId: string) => {
    setClassTemplates((prev) => ({ ...prev, [cls.id]: templateId }));
    applyToClass.mutate(
      { classId: cls.id, templateId },
      {
        onSuccess: () => {
          toast.success(`Applied "${getTemplateName(templateId)}" to "${cls.name}".`);
          setAppliedClasses((prev) => new Set(prev).add(cls.id));
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply.");
          setClassTemplates((prev) => ({ ...prev, [cls.id]: "" }));
        },
      }
    );
  };

  // ── Program table data ────────────────────────────────────────────────────

  const programsTableData = useMemo(
    () =>
      programs.map((prog) => ({
        id: prog.id,
        name: prog.name,
        type: prog.type,
        classCount: prog.classes.length,
      })),
    [programs]
  );

  const programColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Program",
        cell: ({ row }: any) => {
          const color =
            PROGRAM_TYPE_COLORS[row.original.type as keyof typeof PROGRAM_TYPE_COLORS]
            ?? "bg-slate-500/10 text-slate-600 border-slate-200";
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm not-interactive">{row.original.name}</span>
              <Badge
                variant="outline"
                className={cn("text-xs border px-2 py-0.5 w-fit font-normal not-interactive", color)}
              >
                {PROGRAM_TYPE_LABELS[row.original.type as keyof typeof PROGRAM_TYPE_LABELS]
                  ?? row.original.type}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "classCount",
        header: "Classes",
        cell: ({ row }: any) => (
          <span className="text-sm not-interactive">{row.original.classCount}</span>
        ),
      },
      {
        id: "actions",
        header: "Template",
        cell: ({ row }: any) => {
          const prog = programs.find((p) => p.id === row.original.id);
          if (!prog) return null;
          return (
            <div className="flex items-center gap-2">
              {appliedPrograms.has(prog.id) && programTemplates[prog.id] && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <Select
                value={programTemplates[prog.id] ?? ""}
                onValueChange={(templateId) =>
                  handleProgramTemplateSelect(prog, templateId)
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Select template…">
                    {programTemplates[prog.id]
                      ? getTemplateName(programTemplates[prog.id])
                      : "Select template…"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t, i) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500"][i % 10])} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
    ],
    [programs, programTemplates, appliedPrograms, templates, isPending]
  );

  // ── Class table data ──────────────────────────────────────────────────────

  const classesTableData = useMemo(
    () =>
      programs.flatMap((prog) =>
        prog.classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          program: prog.name,
          programId: prog.id,
          programType: prog.type,
        }))
      ),
    [programs]
  );

  const classColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Class",
      },
      {
        accessorKey: "program",
        header: "Program",
        cell: ({ row }: any) => {
          const color =
            PROGRAM_TYPE_COLORS[row.original.programType as keyof typeof PROGRAM_TYPE_COLORS]
            ?? "bg-slate-500/10 text-slate-600 border-slate-200";
          return (
            <Badge
              variant="outline"
              className={cn("text-xs border px-2 py-0.5 w-fit font-normal not-interactive", color)}
            >
              {PROGRAM_TYPE_LABELS[row.original.programType as keyof typeof PROGRAM_TYPE_LABELS]
                ?? row.original.program}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Template",
        cell: ({ row }: any) => {
          const cls = classesTableData.find((c) => c.id === row.original.id);
          if (!cls) return null;
          return (
            <div className="flex items-center gap-2">
              {appliedClasses.has(cls.id) && classTemplates[cls.id] && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <Select
                value={classTemplates[cls.id] ?? ""}
                onValueChange={(templateId) => handleApplyToClass(cls, templateId)}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="Select template…">
                    {classTemplates[cls.id]
                      ? getTemplateName(classTemplates[cls.id])
                      : "Select template…"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t, i) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-rose-500"][i % 10])} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
    ],
    [classesTableData, classTemplates, appliedClasses, templates, isPending]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2 border-b pb-3">
          <Button
            size="sm"
            variant={selectedMode === "program" ? "default" : "ghost"}
            onClick={() => setSelectedMode("program")}
          >
            <Layers className="h-3.5 w-3.5 mr-2" />
            Apply to Program
          </Button>
          <Button
            size="sm"
            variant={selectedMode === "class" ? "default" : "ghost"}
            onClick={() => setSelectedMode("class")}
          >
            <Layers className="h-3.5 w-3.5 mr-2" />
            Apply to Class
          </Button>
        </div>

        {selectedMode === "program" && (
          <div className="rounded-lg border overflow-hidden">
            <DataTable
              columns={programColumns}
              data={programsTableData}
              isLoading={isLoading}
              emptyTitle="No programs found"
              emptyDescription="No programs exist for this school year."
            />
          </div>
        )}

        {selectedMode === "class" && (
          <div className="rounded-lg border overflow-hidden">
            <DataTable
              columns={classColumns}
              data={classesTableData}
              isLoading={isLoading}
              emptyTitle="No classes found"
              emptyDescription="No classes exist for this school year."
            />
          </div>
        )}
      </div>

      {pendingApply && (
        <ConfirmDialog
          open
          title="Apply template to all classes?"
          message={`This will apply "${pendingApply.templateName}" to all ${pendingApply.classCount} class${
            pendingApply.classCount !== 1 ? "es" : ""
          } in "${pendingApply.programName}". Existing grading schemes on those classes will be overwritten.`}
          confirmLabel="Apply to All Classes"
          destructive={false}
          isLoading={applyToProgram.isPending}
          onConfirm={confirmApplyToProgram}
          onOpenChange={(o) => {
            if (!o) {
              setProgramTemplates((prev) => ({
                ...prev,
                [pendingApply.programId]: "",
              }));
              setPendingApply(null);
            }
          }}
        />
      )}
    </>
  );
}
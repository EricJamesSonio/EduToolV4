// ===== File: frontend/src/components/admin/grading-scheme-template/TemplateAssignmentPanel.tsx =====
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
import { cn } from "@/lib/utils";
import { PROGRAM_TYPE_COLORS, PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { Badge } from "@/components/ui/badge";

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

  // Controlled select values — keyed by program/class id
  const [programTemplates, setProgramTemplates] = useState<Record<string, string>>({});
  const [classTemplates, setClassTemplates] = useState<Record<string, string>>({});

  // Track which ones have been successfully applied
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
          toast.success(
            `Applied "${pendingApply.templateName}" to ${count} classes.`
          );
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
          setProgramTemplates((prev) => ({
            ...prev,
            [pendingApply.programId]: "",
          }));
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
          toast.success(
            `Applied "${getTemplateName(templateId)}" to "${cls.name}".`
          );
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

  // ================= TABLE DATA FOR PROGRAMS =================
  const programsTableData = useMemo(
    () =>
      programs.map((prog) => ({
        id: prog.id,
        name: prog.name,
        classCount: prog.classes.length,
        type: prog.type,
      })),
    [programs]
  );

  // ================= TABLE COLUMNS FOR PROGRAMS =================
  const programColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Program",
      },
      {
        accessorKey: "classCount",
        header: "Classes",
        cell: ({ row }: any) => (
          <span className="text-sm">{row.original.classCount}</span>
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
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name}
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

  // ================= TABLE DATA FOR CLASSES =================
  const classesTableData = useMemo(
    () =>
      programs.flatMap((prog) =>
        prog.classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          program: prog.name,
          programId: prog.id,
        }))
      ),
    [programs]
  );

  // ================= TABLE COLUMNS FOR CLASSES =================
  const classColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Class",
      },
      {
        accessorKey: "program",
        header: "Program",
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
                onValueChange={(templateId) =>
                  handleApplyToClass(cls, templateId)
                }
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
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name}
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

        {/* Program mode table */}
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

        {/* Class mode table */}
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

      {/* Confirm dialog for program-level apply */}
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
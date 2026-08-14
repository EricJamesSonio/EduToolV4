// frontend/src/components/admin/grading-scheme-template/TemplateAssignmentPanel.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle, Check, CheckCircle2, Layers, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { PROGRAM_TYPE_COLORS, PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useApplyTemplateToClass,
  useApplyTemplateToProgram,
  useGradingSchemeProgramAssignments,
  useGradingSchemeClassAssignments,
  useRemoveGradingSchemeProgramAssignment,
} from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { ProgramTemplateAssignment } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface ClassInfo {
  id: string;
  name: string;
  programId?: string;
  templateId?: string | null;
}

interface ProgramInfo {
  id: string;
  name: string;
  type: string;
  classes: ClassInfo[];
}

interface ProgramRow extends ProgramInfo {
  assignedTemplateId: string | null;
  assignedTemplateName: string | null;
  classCount: number;
}

interface ClassRow {
  id: string;
  name: string;
  programId: string;
  programName: string;
  programType: string;
}

interface TemplateAssignmentPanelProps {
  programs: ProgramInfo[];
  templates: GradingSchemeTemplate[];
  schoolYearId?: string | null;
  isLoading: boolean;
}

const DOT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-rose-500",
];

function typeBadge(type: string) {
  return cn(
    "text-xs border px-2 py-0.5 w-fit font-normal not-interactive",
    PROGRAM_TYPE_COLORS[type as keyof typeof PROGRAM_TYPE_COLORS] ??
      "bg-slate-500/10 text-slate-600 border-slate-200",
  );
}

export function TemplateAssignmentPanel({
  programs,
  templates,
  schoolYearId,
  isLoading,
}: TemplateAssignmentPanelProps) {
  const queryClient = useQueryClient();

  const [selectedMode, setSelectedMode] = useState<"program" | "class">("program");

  const [assignTarget, setAssignTarget] = useState<ProgramRow | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [removeTarget, setRemoveTarget] = useState<ProgramRow | null>(null);

  const [classTemplates, setClassTemplates] = useState<Record<string, string>>({});
  const [appliedClasses, setAppliedClasses] = useState<Set<string>>(new Set());

  const { data: assignments = [], isLoading: assignmentsLoading } =
    useGradingSchemeProgramAssignments(schoolYearId);

  const { data: classAssignments = [], isLoading: classAssignmentsLoading } =
    useGradingSchemeClassAssignments(schoolYearId);

  const applyToProgram = useApplyTemplateToProgram();
  const applyToClass = useApplyTemplateToClass();
  const removeAssignment = useRemoveGradingSchemeProgramAssignment();
  const isPending = applyToProgram.isPending || applyToClass.isPending || removeAssignment.isPending;

  const refreshAssignments = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin", "gradingSchemeTemplates", "programAssignments"],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", "gradingSchemeTemplates", "classAssignments"],
    });
  };

  // Hydrate the class table with the templates actually applied to each class
  // (inherited via department apply or auto-applied on class creation).
  useEffect(() => {
    setClassTemplates((prev) => {
      const next = { ...prev };
      for (const prog of programs) {
        for (const cls of prog.classes) {
          if (cls.templateId && next[cls.id] === undefined) {
            next[cls.id] = cls.templateId;
          }
        }
      }
      return next;
    });
    setAppliedClasses((prev) => {
      const next = new Set(prev);
      for (const prog of programs) {
        for (const cls of prog.classes) {
          if (cls.templateId) next.add(cls.id);
        }
      }
      return next;
    });
    // Merge freshest per-class assignments from the dedicated endpoint too.
    if (classAssignments.length > 0) {
      setClassTemplates((prev) => {
        const next = { ...prev };
        for (const a of classAssignments) {
          if (next[a.classId] === undefined) next[a.classId] = a.templateId;
        }
        return next;
      });
      setAppliedClasses((prev) => {
        const next = new Set(prev);
        for (const a of classAssignments) next.add(a.classId);
        return next;
      });
    }
  }, [programs, classAssignments]);

  const getTemplateName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? id;

  const assignmentByProgram = useMemo(() => {
    const map = new Map<string, ProgramTemplateAssignment>();
    for (const a of assignments) map.set(a.programId, a);
    return map;
  }, [assignments]);

  const programRows = useMemo<ProgramRow[]>(
    () =>
      programs.map((prog) => {
        const assignment = assignmentByProgram.get(prog.id);
        return {
          ...prog,
          assignedTemplateId: assignment?.templateId ?? null,
          assignedTemplateName: assignment?.templateName ?? null,
          classCount: prog.classes.length,
        };
      }),
    [programs, assignmentByProgram],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  // Validator: a template is only assignable to a program/class when its
  // program type matches (or the template is universal, i.e. no type set).
  const compatibleTemplates = useMemo(() => {
    if (!assignTarget) return templates;
    return templates.filter(
      (t) => !t.programType || t.programType === assignTarget.type,
    );
  }, [templates, assignTarget]);

  const confirmApplyToProgram = () => {
    if (!assignTarget || !selectedTemplateId) return;
    applyToProgram.mutate(
      { programId: assignTarget.id, templateId: selectedTemplateId },
      {
        onSuccess: (res) => {
          toast.success(
            `Applied "${getTemplateName(selectedTemplateId)}" to ${res.appliedCount ?? 0} classes.`,
          );
          refreshAssignments();
          setClassTemplates((prev) => {
            const next = { ...prev };
            assignTarget.classes.forEach((cls) => {
              next[cls.id] = selectedTemplateId;
            });
            return next;
          });
          setAppliedClasses((prev) => {
            const next = new Set(prev);
            assignTarget.classes.forEach((cls) => next.add(cls.id));
            return next;
          });
          setAssignTarget(null);
          setSelectedTemplateId("");
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply template.");
        },
      },
    );
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    removeAssignment.mutate(
      { programId: removeTarget.id, schoolYearId },
      {
        onSuccess: (res) => {
          toast.success(
            res.removedCount > 0
              ? `Removed template from ${res.removedCount} class${res.removedCount !== 1 ? "es" : ""}.`
              : "Assignment removed.",
          );
          setRemoveTarget(null);
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to remove assignment.");
        },
      },
    );
  };

  // ── Program table ──────────────────────────────────────────────────────────

  const programColumns = useMemo<ColumnDef<ProgramRow>[]>(
    () => [
      {
        id: "name",
        header: "Department",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.assignedTemplateName ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <div className="h-4 w-4 shrink-0" />
            )}
            <div className="space-y-1">
              <span className="font-medium text-sm not-interactive">{row.original.name}</span>
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs border px-2 py-0.5 w-fit font-normal",
                    PROGRAM_TYPE_COLORS[
                      row.original.type as keyof typeof PROGRAM_TYPE_COLORS
                    ] ?? "bg-slate-500/10 text-slate-600 border-slate-200",
                  )}
                >
                  {PROGRAM_TYPE_LABELS[
                    row.original.type as keyof typeof PROGRAM_TYPE_LABELS
                  ] ?? row.original.type}
                </Badge>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "assignedTemplate",
        header: "Assigned Template",
        cell: ({ row }) =>
          row.original.assignedTemplateName ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium not-interactive">
                {row.original.assignedTemplateName}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground not-interactive">Not assigned</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
              onClick={() => {
                setAssignTarget(row.original);
                setSelectedTemplateId(row.original.assignedTemplateId ?? "");
              }}
            >
              <Check className="h-3.5 w-3.5" />
              {row.original.assignedTemplateName ? "Change" : "Assign"}
            </Button>
            {row.original.assignedTemplateName && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => setRemoveTarget(row.original)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  // ── Class table ────────────────────────────────────────────────────────────

  const classRows = useMemo<ClassRow[]>(
    () =>
      programs.flatMap((prog) =>
        prog.classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          programId: prog.id,
          programName: prog.name,
          programType: prog.type,
        })),
      ),
    [programs],
  );

  const classColumns = useMemo<ColumnDef<ClassRow>[]>(
    () => [
      {
        id: "name",
        header: "Class",
        cell: ({ row }) => (
          <span className="font-medium text-sm not-interactive">{row.original.name}</span>
        ),
      },
      {
        id: "program",
        header: "Department",
        cell: ({ row }) => (
          <Badge variant="outline" className={typeBadge(row.original.programType)}>
            {PROGRAM_TYPE_LABELS[
              row.original.programType as keyof typeof PROGRAM_TYPE_LABELS
            ] ?? row.original.programName}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Template",
        cell: ({ row }) => {
          const cls = row.original;
          const compatibleForClass = templates.filter(
            (t) => !t.programType || t.programType === cls.programType,
          );
          return (
            <div className="flex items-center gap-2">
              {appliedClasses.has(cls.id) && classTemplates[cls.id] && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
              <Select
                value={classTemplates[cls.id] ?? ""}
                onValueChange={(templateId) => {
                  const id = templateId ?? "";
                  setClassTemplates((prev) => ({ ...prev, [cls.id]: id }));
                  applyToClass.mutate(
                    { classId: cls.id, templateId: id },
                    {
                      onSuccess: () => {
                        const name =
                          templates.find((t) => t.id === id)?.name ?? id;
                        toast.success(`Applied "${name}" to "${cls.name}".`);
                        setAppliedClasses((prev) => new Set(prev).add(cls.id));
                        refreshAssignments();
                      },
                      onError: (e) => {
                        const err = e as AxiosError<{ message: string }>;
                        toast.error(err?.response?.data?.message ?? "Failed to apply.");
                        setClassTemplates((prev) => ({ ...prev, [cls.id]: "" }));
                      },
                    },
                  );
                }}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-56 text-xs">
                  <SelectValue placeholder="Select template…">
                    {classTemplates[cls.id]
                      ? templates.find((t) => t.id === classTemplates[cls.id])?.name ??
                        classTemplates[cls.id]
                      : "Select template…"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {compatibleForClass.map((t, i) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            DOT_COLORS[i % DOT_COLORS.length],
                          )}
                        />
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
    [classTemplates, appliedClasses, templates, isPending, applyToClass],
  );

  if (isLoading || assignmentsLoading || classAssignmentsLoading) {
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
            Assign to Department
          </Button>
          <Button
            size="sm"
            variant={selectedMode === "class" ? "default" : "ghost"}
            onClick={() => setSelectedMode("class")}
          >
            <Layers className="h-3.5 w-3.5 mr-2" />
            Assign to Class
          </Button>
        </div>

        {selectedMode === "program" && (
          <div className="rounded-lg border overflow-hidden">
            <DataTable
              columns={programColumns}
              data={programRows}
              emptyTitle="No departments found"
              emptyDescription="No departments exist for this school year."
            />
          </div>
        )}

        {selectedMode === "class" && (
          <div className="rounded-lg border overflow-hidden">
            <DataTable
              columns={classColumns}
              data={classRows}
              emptyTitle="No classes found"
              emptyDescription="No classes exist for this school year."
            />
          </div>
        )}
      </div>

      {/* Assign dialog (program mode) */}
      {assignTarget && (
        <Dialog
          open={!!assignTarget}
          onOpenChange={(o) => {
            if (!o) {
              setAssignTarget(null);
              setSelectedTemplateId("");
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Assign Grading Scheme Template
              </DialogTitle>
            </DialogHeader>

            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground not-interactive">Department</p>
              <p className="font-medium text-sm not-interactive">{assignTarget.name}</p>
              <Badge variant="outline" className={typeBadge(assignTarget.type)}>
                {PROGRAM_TYPE_LABELS[
                  assignTarget.type as keyof typeof PROGRAM_TYPE_LABELS
                ] ?? assignTarget.type}
              </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium not-interactive">Select Template</label>
              <Select
                value={selectedTemplateId}
                onValueChange={(v) => setSelectedTemplateId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {compatibleTemplates.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground not-interactive">
                      No templates available for this department type
                    </div>
                  ) : (
                    compatibleTemplates.map((template, i) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              DOT_COLORS[i % DOT_COLORS.length],
                            )}
                          />
                          {template.name} ({template.components?.length ?? 0} components)
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <p className="text-xs text-muted-foreground not-interactive">Template Details</p>
                <p className="font-medium text-sm not-interactive">{selectedTemplate.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground not-interactive">
                  <span>{selectedTemplate.components?.length ?? 0} components</span>
                  {selectedTemplate.programType && (
                    <span>
                      For:{" "}
                      {PROGRAM_TYPE_LABELS[
                        selectedTemplate.programType as keyof typeof PROGRAM_TYPE_LABELS
                      ] ?? selectedTemplate.programType}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-900 not-interactive">
                This will apply the template to all{" "}
                <span className="font-medium">{assignTarget.classCount}</span> class
                {assignTarget.classCount !== 1 ? "es" : ""} in{" "}
                <span className="font-medium">{assignTarget.name}</span>. Existing grading
                schemes on those classes will be overwritten.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignTarget(null);
                  setSelectedTemplateId("");
                }}
                disabled={applyToProgram.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApplyToProgram}
                disabled={applyToProgram.isPending || !selectedTemplateId}
              >
                {applyToProgram.isPending ? "Applying..." : "Yes, Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Remove confirm (program mode) */}
      {removeTarget && (
        <ConfirmDialog
          open
          title="Remove template assignment?"
          message={`This will remove the template from all classes in "${removeTarget.name}". Educator-customized grading schemes and schemes from other templates will be kept.`}
          confirmLabel="Yes, Remove"
          destructive
          isLoading={removeAssignment.isPending}
          onConfirm={confirmRemove}
          onOpenChange={(o) => {
            if (!o) setRemoveTarget(null);
          }}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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

  // Controlled select values — keyed by program/class id
  const [programTemplates, setProgramTemplates] = useState<Record<string, string>>({});
  const [classTemplates, setClassTemplates]     = useState<Record<string, string>>({});

  // Track which ones have been successfully applied
  const [appliedPrograms, setAppliedPrograms] = useState<Set<string>>(new Set());
  const [appliedClasses, setAppliedClasses]   = useState<Set<string>>(new Set());

  const [pendingApply, setPendingApply] = useState<PendingProgramApply | null>(null);

  const applyToProgram = useApplyTemplateToProgram();
  const applyToClass   = useApplyTemplateToClass();
  const isPending      = applyToProgram.isPending || applyToClass.isPending;

  const getTemplateName = (id: string) =>
    templates.find((t) => t.id === id)?.name ?? id;

  const handleProgramTemplateSelect = (prog: ProgramInfo, templateId: string) => {
    setProgramTemplates((prev) => ({ ...prev, [prog.id]: templateId }));
    setPendingApply({
      programId:    prog.id,
      programName:  prog.name,
      templateId,
      templateName: getTemplateName(templateId),
      classCount:   prog.classes.length,
    });
  };

  const confirmApplyToProgram = () => {
    if (!pendingApply) return;
    applyToProgram.mutate(
      { programId: pendingApply.programId, templateId: pendingApply.templateId },
      {
        onSuccess: (res) => {
          const count = res.appliedCount ?? 0;
          toast.success(
            count > 0
              ? `Applied "${pendingApply.templateName}" to ${count} class${count !== 1 ? "es" : ""}.`
              : `Template saved. No classes found in this program yet.`
          );
          setAppliedPrograms((prev) => new Set(prev).add(pendingApply.programId));
          setPendingApply(null);
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply.");
          // Reset the select on error
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
            Apply to Program
          </Button>
          <Button
            size="sm"
            variant={selectedMode === "class" ? "default" : "ghost"}
            onClick={() => setSelectedMode("class")}
          >
            Apply to Class
          </Button>
        </div>

        {/* Program mode */}
        {selectedMode === "program" && (
          <div className="space-y-3">
            {programs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No programs found</p>
            ) : (
              programs.map((prog) => (
                <div
                  key={prog.id}
                  className="flex items-center gap-2 py-2 px-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prog.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prog.classes.length} class{prog.classes.length !== 1 ? "es" : ""}
                    </p>
                  </div>
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
                    <SelectTrigger className="h-8 w-44 text-xs">
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
              ))
            )}
          </div>
        )}

        {/* Class mode */}
        {selectedMode === "class" && (
          <div className="space-y-3">
            {programs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No programs found</p>
            ) : (
              programs.map((prog) => (
                <div key={prog.id} className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {prog.name}
                  </p>
                  {prog.classes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic px-1">
                      No classes
                    </p>
                  ) : (
                    prog.classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center gap-2 py-1.5 px-2 bg-muted/30 rounded"
                      >
                        <span className="flex-1 truncate text-xs font-medium">
                          {cls.name}
                        </span>
                        {appliedClasses.has(cls.id) && classTemplates[cls.id] && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        <Select
                          value={classTemplates[cls.id] ?? ""}
                          onValueChange={(templateId) =>
                            handleApplyToClass(cls, templateId)
                          }
                          disabled={isPending}
                        >
                          <SelectTrigger className="h-7 w-40 text-xs">
                            <SelectValue placeholder="Template…">
                              {classTemplates[cls.id]
                                ? getTemplateName(classTemplates[cls.id])
                                : "Template…"}
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
                    ))
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirm dialog for program-level apply */}
      {pendingApply && (
        <ConfirmDialog
          open
          title="Apply template to all classes?"
          message={`This will apply "${pendingApply.templateName}" to all ${pendingApply.classCount} class${pendingApply.classCount !== 1 ? "es" : ""} in "${pendingApply.programName}". Existing grading schemes on those classes will be overwritten.`}
          confirmLabel="Apply to All Classes"
          destructive={false}
          isLoading={applyToProgram.isPending}
          onConfirm={confirmApplyToProgram}
          onOpenChange={(o) => {
            if (!o) {
              // Reset select if user cancels
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
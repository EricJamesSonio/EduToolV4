// src/components/admin/grading-scheme-template/TemplateAssignmentPanel.tsx
"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApplyTemplateToClass, useApplyTemplateToProgram } from "@/hooks/admin/useGradingSchemeTemplates";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";
import type { AxiosError } from "axios";

interface ClassInfo {
  id: string;
  name: string;
  programId: string;
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

export function TemplateAssignmentPanel({
  programs,
  templates,
  isLoading,
}: TemplateAssignmentPanelProps) {
  const [selectedMode, setSelectedMode] = useState<"program" | "class">("program");
  const applyToProgram = useApplyTemplateToProgram();
  const applyToClass = useApplyTemplateToClass();

  const isPending = applyToProgram.isPending || applyToClass.isPending;

  const handleApplyToProgram = (programId: string, templateId: string) => {
    applyToProgram.mutate(
      { programId, templateId },
      {
        onSuccess: () => {
          toast.success("Template applied to program.");
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply.");
        },
      }
    );
  };

  const handleApplyToClass = (classId: string, templateId: string) => {
    applyToClass.mutate(
      { classId, templateId },
      {
        onSuccess: () => {
          toast.success("Template applied to class.");
        },
        onError: (e) => {
          const err = e as AxiosError<{ message: string }>;
          toast.error(err?.response?.data?.message ?? "Failed to apply.");
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
              <div key={prog.id} className="flex items-center gap-2 py-2 px-1 border rounded">
                <span className="text-sm font-medium min-w-0 flex-1 truncate">{prog.name}</span>
                <Select
                  onValueChange={(templateId) =>
                    handleApplyToProgram(prog.id, templateId)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Select template…" />
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
              <div key={prog.id} className="rounded border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{prog.name}</p>
                {prog.classes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1">No classes</p>
                ) : (
                  prog.classes.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-2 py-1.5 px-1 bg-muted/30 rounded text-sm">
                      <span className="flex-1 truncate text-xs">{cls.name}</span>
                      <Select
                        onValueChange={(templateId) =>
                          handleApplyToClass(cls.id, templateId)
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs">
                          <SelectValue placeholder="Template…" />
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
  );
}
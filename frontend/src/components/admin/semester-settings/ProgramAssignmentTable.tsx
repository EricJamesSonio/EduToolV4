// ===== File: frontend/src/components/admin/semester-settings/ProgramAssignmentTable.tsx =====
"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssignRow } from "./AssignRow";
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

export function ProgramAssignmentTable({
  programs,
  templates,
  schoolYearStart,
  schoolYearEnd,
  isLoading,
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
    () => Array.from(programsByType.keys()),
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

            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="divide-y">
                {typePrograms.map((p) => (
                  <AssignRow
                    key={p.id}
                    program={p}
                    templates={compatibleTemplates}
                    schoolYearStart={schoolYearStart}
                    schoolYearEnd={schoolYearEnd}
                  />
                ))}
              </div>
            </div>

            {/* Warning for unassigned programs */}
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
// ===== File: frontend/src/components/admin/grading-scheme-template/TemplateApplicationPanel.tsx =====
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { TemplateAssignmentPanel } from "./TemplateAssignmentPanel";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { GradingSchemeTemplate } from "@/types/admin/grading-scheme-template.types";

interface Program {
  id: string;
  name: string;
  type: string;
  classes: Array<{
    id: string;
    name: string;
    programId: string;
  }>;
}

interface TemplateApplicationPanelProps {
  schoolYears: SchoolYear[];
  selectedYearId: string;
  onYearChange: (yearId: string) => void;
  programs: Program[];
  templates: GradingSchemeTemplate[];
  isLoading: boolean;
}

export function TemplateApplicationPanel({
  schoolYears,
  selectedYearId,
  onYearChange,
  programs,
  templates,
  isLoading,
}: TemplateApplicationPanelProps): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          School Year
        </p>
        <Select value={selectedYearId} onValueChange={(v) => onYearChange(v ?? "")}>
          <SelectTrigger className="h-8 text-xs">
            <span className="truncate text-xs">
              {schoolYears.find((sy) => sy.id === selectedYearId)?.name ??
                "Select school year…"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {schoolYears.map((sy) => (
              <SelectItem key={sy.id} value={sy.id} className="text-xs">
                {sy.name}
                {sy.status === "active" && (
                  <span className="ml-1.5 text-emerald-600 text-[10px]">
                    • Active
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Apply Templates
        </p>
        <TemplateAssignmentPanel
          programs={programs}
          templates={templates}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
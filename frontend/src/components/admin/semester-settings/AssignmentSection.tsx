// ===== File: frontend/src/components/admin/semester-settings/AssignmentSection.tsx =====
"use client";

import { useMemo } from "react";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { ProgramAssignmentTable } from "./ProgramAssignmentTable";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { TemplateAssignment } from "@/types/admin/semester-template.types";
import type { SemesterTemplate } from "@/types/admin/semester-template.types";

interface Program {
  id: string;
  name: string;
  type: string;
  school_year_id: string;
  semesterAssignment: TemplateAssignment | null;
}

interface AssignmentSectionProps {
  schoolYears: SchoolYear[];
  programs: Program[];
  templates: SemesterTemplate[];
  selectedYearId: string | null;
  onYearSelect: (yearId: string | null) => void;
  isSchoolYearsLoading: boolean;
  isProgramsLoading: boolean;
}

export function AssignmentSection({
  schoolYears,
  programs,
  templates,
  selectedYearId,
  onYearSelect,
  isSchoolYearsLoading,
  isProgramsLoading,
}: AssignmentSectionProps): React.JSX.Element {
  const selectedSchoolYear = useMemo(
    () => schoolYears.find((sy) => sy.id === selectedYearId) ?? null,
    [schoolYears, selectedYearId]
  );

  return (
    <div className="space-y-4">
      {/* Header with School Year Selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Assign to Programs
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a school year to assign semester templates and configure term
            dates for its programs.
          </p>
        </div>

        <SchoolYearSelector
          schoolYears={schoolYears}
          isLoading={isSchoolYearsLoading}
          selectedId={selectedYearId}
          onSelect={onYearSelect}
        />
      </div>

      {/* School Year Date Range Hint */}
      {selectedSchoolYear?.start_date && selectedSchoolYear?.end_date && (
        <p className="text-xs text-muted-foreground">
          School year range:{" "}
          <span className="font-medium text-foreground">
            {new Date(selectedSchoolYear.start_date).toLocaleDateString()} –{" "}
            {new Date(selectedSchoolYear.end_date).toLocaleDateString()}
          </span>
          . Term dates must fall within this range.
        </p>
      )}

      {/* Programs Assignment Table */}
      {!selectedYearId ? (
        <p className="text-sm text-muted-foreground">
          Select a school year to view programs.
        </p>
      ) : (
        <ProgramAssignmentTable
          programs={programs}
          templates={templates}
          schoolYearStart={selectedSchoolYear?.start_date ?? null}
          schoolYearEnd={selectedSchoolYear?.end_date ?? null}
          isLoading={isProgramsLoading}
        />
      )}
    </div>
  );
}
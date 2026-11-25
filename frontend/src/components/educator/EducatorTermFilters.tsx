"use client";

import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EducatorTermScope } from "@/hooks/educator/useEducatorTermScope";

export function EducatorTermFilters({
  scope,
}: {
  scope: EducatorTermScope;
}): React.JSX.Element {
  return (
    <>
      <div className="w-full sm:w-72">
        <SchoolYearSelector
          schoolYears={scope.schoolYearOptions}
          isLoading={scope.isLoading}
          selectedId={scope.schoolYearId}
          onSelect={scope.handleSchoolYearChange}
        />
      </div>
      {scope.semesters.length > 0 && (
        <Select value={scope.semesterId} onValueChange={scope.handleSemesterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select semester">
              {scope.selectedSemesterName ?? "Select semester"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {scope.semesters.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
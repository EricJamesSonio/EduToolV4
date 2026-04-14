"use client";

import { SearchInput } from "@/components/shared/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentHierarchyFilter, type HierarchySelection } from "./StudentHierarchyFilter";
import type { GetStudentsQuery } from "@/api/admin/student.api";
import type { StudentStatus }    from "@/types/admin/student.types";

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active",      label: "Active" },
  { value: "pending",     label: "Pending" },
  { value: "suspended",   label: "Suspended" },
  { value: "dropped",     label: "Dropped" },
  { value: "transferred", label: "Transferred" },
  { value: "graduated",   label: "Graduated" },
];

interface StudentFilterBarProps {
  filters:  GetStudentsQuery;
  onChange: (filters: GetStudentsQuery) => void;
}

export function StudentFilterBar({ filters, onChange }: StudentFilterBarProps): React.JSX.Element {

  function set(patch: Partial<GetStudentsQuery>): void {
    onChange({ ...filters, ...patch });
  }

  // Derive the hierarchy selection from the flat filters object
  const hierarchyValue: HierarchySelection = {
    schoolYearId: filters.schoolYearId,
    programId:    filters.programId,
    courseId:     filters.courseId,
    strandId:     filters.strandId,
    levelId:      filters.levelId,
    sectionId:    filters.sectionId,
  };

  function handleHierarchyChange(next: HierarchySelection): void {
    onChange({
      // Preserve non-hierarchy filters
      search: filters.search,
      status: filters.status,
      // Spread hierarchy (undefined values will remove keys)
      schoolYearId: next.schoolYearId,
      programId:    next.programId,
      courseId:     next.courseId,
      strandId:     next.strandId,
      levelId:      next.levelId,
      sectionId:    next.sectionId,
    });
  }

  return (
    <div className="space-y-3">
      {/* Row 1: Hierarchy cascade */}
      <StudentHierarchyFilter
        value={hierarchyValue}
        onChange={handleHierarchyChange}
      />

      {/* Row 2: Search + Status */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => set({ search: v || undefined })}
          placeholder="Search by name or student ID…"
          className="w-64"
        />

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            set({ status: v === "all" ? undefined : (v as StudentStatus) })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
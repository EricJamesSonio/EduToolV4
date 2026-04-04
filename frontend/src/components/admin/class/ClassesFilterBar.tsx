"use client";

import { useQuery } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import { educatorApi } from "@/api/admin/educator.api";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { Semester } from "@/types/admin/semester.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toArray } from "@/utils/classes.utils";
import type { useClassFilters } from "@/hooks/admin/useClassFilters";

type ClassFiltersState = ReturnType<typeof useClassFilters>;

type ClassesFilterBarProps = Pick<
  ClassFiltersState,
  | "filterSchoolYearId"
  | "filterSemesterId"
  | "filterEducatorId"
  | "handleSchoolYearChange"
  | "setFilterSemesterId"
  | "setFilterEducatorId"
>;

export function ClassesFilterBar({
  filterSchoolYearId,
  filterSemesterId,
  filterEducatorId,
  handleSchoolYearChange,
  setFilterSemesterId,
  setFilterEducatorId,
}: ClassesFilterBarProps): React.JSX.Element {
  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });
  const schoolYears = toArray<SchoolYear>(schoolYearsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters", filterSchoolYearId],
    queryFn: () => semesterApi.getAll(),
    enabled: filterSchoolYearId !== "all",
  });
  const semesters = toArray<Semester>(semestersRaw);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* School Year */}
      <Select value={filterSchoolYearId} onValueChange={(v) => handleSchoolYearChange(v ?? "all")}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All School Years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All School Years</SelectItem>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              {sy.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Semester */}
      <Select
        value={filterSemesterId}
        onValueChange={(v) => setFilterSemesterId(v ?? "all")}
        disabled={filterSchoolYearId === "all"}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Semesters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Semesters</SelectItem>
          {semesters.map((sem) => (
            <SelectItem key={sem.id} value={sem.id}>
              {sem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Educator */}
      <Select
        value={filterEducatorId}
        onValueChange={(v) => setFilterEducatorId(v ?? "all")}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Educators" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Educators</SelectItem>
          {educators.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
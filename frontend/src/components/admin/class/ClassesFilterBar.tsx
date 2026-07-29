"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { educatorApi } from "@/api/admin/educator.api";
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
  "filterSemesterId" | "filterEducatorId" | "setFilterSemesterId" | "setFilterEducatorId"
> & {
  schoolYearId: string | null;
};

export function ClassesFilterBar({
  filterSemesterId,
  filterEducatorId,
  setFilterSemesterId,
  setFilterEducatorId,
  schoolYearId,
}: ClassesFilterBarProps): React.JSX.Element {
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
  );
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list({ schoolYearId }),
    () => semesterApi.getAll(),
    { enabled: !!schoolYearId },
  );
  const semesters = toArray<Semester>(semestersRaw);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Semester */}
      <Select
        value={filterSemesterId}
        onValueChange={(v) => setFilterSemesterId(v ?? "all")}
        disabled={!schoolYearId}
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
"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { educatorApi } from "@/api/admin/educator.api";
import { programApi } from "@/api/admin/program.api";
import type { Semester } from "@/types/admin/semester.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toArray } from "@/utils/classes.utils";
import type { useClassFilters } from "@/hooks/admin/useClassFilters";

type ClassFiltersState = ReturnType<typeof useClassFilters>;
type ClassesFilterBarProps = Pick<
  ClassFiltersState,
  | "filterProgramId"
  | "filterSemesterId"
  | "filterEducatorId"
  | "search"
  | "setFilterProgramId"
  | "setFilterSemesterId"
  | "setFilterEducatorId"
  | "setSearch"
> & {
  schoolYearId: string | null;
};

export function ClassesFilterBar({
  filterProgramId,
  filterSemesterId,
  filterEducatorId,
  search,
  setFilterProgramId,
  setFilterSemesterId,
  setFilterEducatorId,
  setSearch,
  schoolYearId,
}: ClassesFilterBarProps): React.JSX.Element {
  // ===== Educators =====
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
  );
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  // ===== Departments (Programs) — scoped to the selected school year =====
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  // ===== Semesters =====
  // When a department is selected: fetch only the semesters actually
  // assigned to that department's semester template, for this school year.
  // Uses the real semesterApi.getByProgram(programId, schoolYearId) method —
  // GET /programs/:id/semesters?schoolYearId=... — already returns deduped,
  // correctly-named Semester rows, so no extra client-side dedup is needed.
  const { data: deptSemestersRaw } = useAsyncQuery(
    queryKeys.admin.programs.semesters(filterProgramId, schoolYearId),
    () => semesterApi.getByProgram(filterProgramId, schoolYearId!),
    { enabled: !!schoolYearId && filterProgramId !== "all" },
  );

  // When no department is selected: fall back to all semesters for the
  // current school year only (still scoped — no more cross-year duplicates
  // like the old semesterApi.getAll() with no schoolYearId argument).
  const { data: allSemestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list({ schoolYearId }),
    () => semesterApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId && filterProgramId === "all" },
  );

  const semesters = toArray<Semester>(
    filterProgramId !== "all" ? deptSemestersRaw : allSemestersRaw,
  );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search — subject or educator name */}
      <Input
        placeholder="Search subject or educator..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-56"
      />

      {/* Department */}
      <Select
        value={filterProgramId}
        onValueChange={(v) => setFilterProgramId(v ?? "all")}
        disabled={!schoolYearId}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Semester — scoped to the selected department (or school year if "all") */}
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
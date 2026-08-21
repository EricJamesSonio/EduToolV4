"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { programApi } from "@/api/admin/program.api";
import { classApi } from "@/api/admin/class.api";
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
  | "setDepartmentAndSemester"
  | "setSearch"
> & {
  schoolYearId: string | null;
};

interface GroupedSemester {
  semesterId: string;
  semesterName: string;
  programId: string;
  programName: string;
}

// A composite key so a single <Select> can carry both programId and
// semesterId for the "All Departments" grouped list — a semester name can
// resolve to the same physical Semester row across different departments'
// templates, so we can't identify the intended selection by semesterId alone.
const encodeComposite = (programId: string, semesterId: string) =>
  `${programId}::${semesterId}`;
const decodeComposite = (value: string): [string, string] => {
  const [programId, semesterId] = value.split("::");
  return [programId, semesterId];
};

export function ClassesFilterBar({
  filterProgramId,
  filterSemesterId,
  filterEducatorId,
  search,
  setFilterProgramId,
  setFilterSemesterId,
  setFilterEducatorId,
  setDepartmentAndSemester,
  setSearch,
  schoolYearId,
}: ClassesFilterBarProps): React.JSX.Element {
  // ===== Departments (Programs) — scoped to the selected school year =====
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  // ===== Semesters =====
  // Department selected: plain department-scoped list, no ambiguity —
  // labels are just the semester name.
  const { data: deptSemestersRaw } = useAsyncQuery(
    queryKeys.admin.programs.semesters(filterProgramId, schoolYearId),
    () => semesterApi.getByProgram(filterProgramId, schoolYearId!),
    { enabled: !!schoolYearId && filterProgramId !== "all" },
  );
  const deptSemesters = toArray<Semester>(deptSemestersRaw);

  // Department = "All": grouped list, one entry per (program, semester)
  // pairing that actually exists this school year — e.g. "1st - College",
  // "1st - Daycare" as distinct, selectable options even when they happen
  // to share the same underlying semesterId.
  const { data: groupedSemestersRaw } = useAsyncQuery(
    queryKeys.admin.programs.semestersGrouped(schoolYearId),
    () => programApi.getSemestersGrouped(schoolYearId!),
    { enabled: !!schoolYearId && filterProgramId === "all" },
  );
  const groupedSemesters = toArray<GroupedSemester>(groupedSemestersRaw);

  // ===== Educators — scoped to the current Department/Semester selection =====
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.classes.distinctEducators({
      schoolYearId,
      programId: filterProgramId !== "all" ? filterProgramId : undefined,
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
    }),
    () =>
      classApi.getDistinctEducators({
        schoolYearId: schoolYearId ?? undefined,
        programId: filterProgramId !== "all" ? filterProgramId : undefined,
        semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      }),
    { enabled: !!schoolYearId },
  );
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  function handleSemesterChange(value: string) {
    if (value === "all") {
      setFilterSemesterId("all");
      return;
    }
    if (filterProgramId === "all") {
      // composite value from the grouped list
      const [programId, semesterId] = decodeComposite(value);
      setDepartmentAndSemester(programId, semesterId);
    } else {
      setFilterSemesterId(value);
    }
  }

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
          <SelectValue placeholder="All Departments">
                {programs.find((p) => p.id === filterProgramId)?.name ?? "All Departments"}
              </SelectValue>
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

      {/* Semester — grouped-with-department labels when "All", plain when a
          specific department is already selected */}
      <Select
        // Once a grouped option is picked, setDepartmentAndSemester flips
        // filterProgramId away from "all" on the same render pass, so by
        // the time this re-renders we're already in "department selected"
        // mode and filterSemesterId is a plain id matching deptSemesters —
        // no composite value ever needs to be reflected back here.
        value={filterSemesterId}
        onValueChange={handleSemesterChange}
        disabled={!schoolYearId}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All Semesters">
                {filterProgramId === "all"
                  ? groupedSemesters.find((g) => encodeComposite(g.programId, g.semesterId) === filterSemesterId)?.semesterName
                  : deptSemesters.find((s) => s.id === filterSemesterId)?.name ?? "All Semesters"}
              </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Semesters</SelectItem>
          {filterProgramId === "all"
            ? groupedSemesters.map((g) => (
                <SelectItem
                  key={encodeComposite(g.programId, g.semesterId)}
                  value={encodeComposite(g.programId, g.semesterId)}
                >
                  {g.semesterName} - {g.programName}
                </SelectItem>
              ))
            : deptSemesters.map((sem) => (
                <SelectItem key={sem.id} value={sem.id}>
                  {sem.name}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>

      {/* Educator — scoped to the current Department/Semester selection */}
      <Select
        value={filterEducatorId}
        onValueChange={(v) => setFilterEducatorId(v ?? "all")}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Educators">
                {educators.find((e) => e.id === filterEducatorId)?.fullName ?? "All Educators"}
              </SelectValue>
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
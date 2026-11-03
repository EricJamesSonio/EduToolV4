"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { programApi } from "@/api/admin/program.api";
import { classApi } from "@/api/admin/class.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Semester } from "@/types/admin/semester.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/shared/SearchInput";
import { toArray } from "@/utils/classes.utils";
import type { useClassFilters } from "@/hooks/admin/useClassFilters";

type ClassFiltersState = ReturnType<typeof useClassFilters>;

interface ClassesFilterBarProps {
  filters: ClassFiltersState;
  schoolYearId: string | null;
}

interface NamedItem {
  id: string;
  name: string;
}

interface SectionItem extends NamedItem {
  course_id?: string | null;
  strand_id?: string | null;
}

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
  filters,
  schoolYearId,
}: ClassesFilterBarProps): React.JSX.Element {
  const {
    filterProgramId,
    filterCourseId,
    filterStrandId,
    filterLevelId,
    filterSectionId,
    filterSemesterId,
    filterEducatorId,
    search,
    setFilterProgramId,
    setFilterCourseId,
    setFilterStrandId,
    setFilterLevelId,
    setFilterSectionId,
    setFilterSemesterId,
    setFilterEducatorId,
    setDepartmentAndSemester,
    setSearch,
  } = filters;

  const departmentSelected = filterProgramId !== "all";

  // ===== Departments (Programs) — scoped to the selected school year =====
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  // ===== Courses / Strands — only when the department actually has them =====
  const { data: coursesRaw, isLoading: loadingCourses } = useAsyncQuery(
    queryKeys.admin.courses.list({
      schoolYearId: schoolYearId ?? undefined,
      programId: filterProgramId,
    }),
    () =>
      courseApi.getAll({
        schoolYearId: schoolYearId!,
        programId: filterProgramId,
      }),
    { enabled: !!schoolYearId && departmentSelected },
  );
  const courses = toArray<NamedItem>(coursesRaw);

  const { data: strandsRaw, isLoading: loadingStrands } = useAsyncQuery(
    queryKeys.admin.strands.list({ program_id: filterProgramId }),
    () => strandApi.getAll({ program_id: filterProgramId }),
    { enabled: departmentSelected },
  );
  const strands = toArray<NamedItem>(strandsRaw);

  const hasCourseStrand = courses.length > 0 || strands.length > 0;
  const courseOrStrandSelected =
    filterCourseId !== "all" || filterStrandId !== "all";

  // ===== Levels — unlock once Department (and Course/Strand if any) is settled =====
  const levelStepReady =
    !!schoolYearId &&
    departmentSelected &&
    !loadingCourses &&
    !loadingStrands &&
    (!hasCourseStrand || courseOrStrandSelected);

  const { data: levelsRaw, isLoading: loadingLevels } = useAsyncQuery(
    [
      ...queryKeys.admin.levels.all,
      "class-filter",
      schoolYearId,
      filterProgramId,
      filterCourseId,
      filterStrandId,
    ] as const,
    () => {
      if (filterCourseId !== "all") {
        return levelApi.getByCourse(schoolYearId!, filterCourseId);
      }
      if (filterStrandId !== "all") {
        return levelApi.getByStrand(schoolYearId!, filterStrandId);
      }
      return levelApi.getBySchoolYear(schoolYearId!, filterProgramId);
    },
    { enabled: levelStepReady },
  );
  const levels = toArray<NamedItem>(levelsRaw);

  // ===== Sections — scoped to the selected level =====
  const { data: sectionsRaw, isLoading: loadingSections } = useAsyncQuery(
    queryKeys.admin.sections.list({
      schoolYearId: schoolYearId ?? undefined,
      levelId: filterLevelId,
    }),
    () => sectionApi.getAll(schoolYearId!, filterLevelId),
    { enabled: !!schoolYearId && filterLevelId !== "all" },
  );
  const sections = toArray<SectionItem>(sectionsRaw).filter((s) => {
    if (filterCourseId !== "all") return s.course_id === filterCourseId;
    if (filterStrandId !== "all") return s.strand_id === filterStrandId;
    return true;
  });

  // ===== Semesters =====
  // Department selected: plain department-scoped list, no ambiguity —
  // labels are just the semester name.
  const { data: deptSemestersRaw } = useAsyncQuery(
    queryKeys.admin.programs.semesters(filterProgramId, schoolYearId),
    () => semesterApi.getByProgram(filterProgramId, schoolYearId!),
    { enabled: !!schoolYearId && departmentSelected },
  );
  const deptSemesters = toArray<Semester>(deptSemestersRaw);

  // Department = "All": grouped list, one entry per (program, semester)
  // pairing that actually exists this school year.
  const { data: groupedSemestersRaw } = useAsyncQuery(
    queryKeys.admin.programs.semestersGrouped(schoolYearId),
    () => programApi.getSemestersGrouped(schoolYearId!),
    { enabled: !!schoolYearId && !departmentSelected },
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

  function handleSemesterChange(value: string | null) {
    if (value === null || value === "all") {
      setFilterSemesterId("all");
      return;
    }
    if (!departmentSelected) {
      const [programId, semesterId] = decodeComposite(value);
      setDepartmentAndSemester(programId, semesterId);
    } else {
      setFilterSemesterId(value);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <SearchInput
        placeholder="Search subject or educator..."
        value={search}
        onChange={setSearch}
        className="max-w-xs w-[200px] [&_input]:h-9 [&_input]:text-sm [&_input]:rounded-full"
      />

      {/* Department */}
      <Select
        value={filterProgramId}
        onValueChange={(v) => setFilterProgramId(v ?? "all")}
        disabled={!schoolYearId}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Departments">
            {programs.find((p) => p.id === filterProgramId)?.name ??
              "All Departments"}
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

      {/* Course — only if the department has courses */}
      {departmentSelected &&
        (loadingCourses ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          courses.length > 0 && (
            <Select
              value={filterCourseId}
              onValueChange={(v) => setFilterCourseId(v ?? "all")}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="All Courses">
                  {courses.find((c) => c.id === filterCourseId)?.name ??
                    "All Courses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ))}

      {/* Strand — only if the department has strands */}
      {departmentSelected &&
        (loadingStrands ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          strands.length > 0 && (
            <Select
              value={filterStrandId}
              onValueChange={(v) => setFilterStrandId(v ?? "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Strands">
                  {strands.find((s) => s.id === filterStrandId)?.name ??
                    "All Strands"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strands</SelectItem>
                {strands.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        ))}

      {/* Level */}
      {levelStepReady &&
        (loadingLevels ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <Select
            value={filterLevelId}
            onValueChange={(v) => setFilterLevelId(v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Levels">
                {levels.find((l) => l.id === filterLevelId)?.name ??
                  "All Levels"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

      {/* Section */}
      {levelStepReady &&
        filterLevelId !== "all" &&
        (loadingSections ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <Select
            value={filterSectionId}
            onValueChange={(v) => setFilterSectionId(v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Sections">
                {sections.find((s) => s.id === filterSectionId)?.name ??
                  "All Sections"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

      {/* Semester — grouped-with-department labels when "All", plain when a
          specific department is already selected */}
      <Select
        value={filterSemesterId}
        onValueChange={handleSemesterChange}
        disabled={!schoolYearId}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All Semesters">
            {!departmentSelected
              ? groupedSemesters.find(
                  (g) =>
                    encodeComposite(g.programId, g.semesterId) ===
                    filterSemesterId,
                )?.semesterName
              : deptSemesters.find((s) => s.id === filterSemesterId)?.name ??
                "All Semesters"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Semesters</SelectItem>
          {!departmentSelected
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
            {educators.find((e) => e.id === filterEducatorId)?.fullName ??
              "All Educators"}
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
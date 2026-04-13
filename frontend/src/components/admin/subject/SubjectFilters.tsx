import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FiltersState, FiltersActions } from "./hooks/useSubjectFilters";
import type { SchoolYear } from "@/types/admin/school-year.types";
import type { Program } from "@/types/admin/program.types";
import type { Course,  } from "@/types/admin/course.types";
import type { Strand } from "@/types/admin/strand.types";


interface SubjectFiltersProps extends FiltersState, FiltersActions {
  schoolYears: SchoolYear[];
  programs: Program[];
  courses: Course[];
  strands: Strand[];
  syLoading: boolean;
  programsLoading: boolean;
}

export function SubjectFilters({
  selectedSchoolYearId,
  setSelectedSchoolYearId,
  selectedProgramId,
  setSelectedProgramId,
  filterLevelId,
  setFilterLevelId,
  selectedCourseId,
  setSelectedCourseId,
  selectedStrandId,
  setSelectedStrandId,
  schoolYears,
  programs,
  courses,
  strands,
  syLoading,
  programsLoading,
}: SubjectFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* School Year Selector */}
      <SchoolYearSelector
        schoolYears={schoolYears}
        isLoading={syLoading}
        selectedId={selectedSchoolYearId}
        onSelect={setSelectedSchoolYearId}
      />

      {selectedSchoolYearId && (
        <>
          {/* Program Filter */}
          <Select
            value={selectedProgramId}
            onValueChange={(v) => {
              setSelectedProgramId(v ?? "all");
              setFilterLevelId("all");
              setSelectedCourseId("all");
              setSelectedStrandId("all");
            }}
          >
            <SelectTrigger className="w-48 h-9 text-sm">
              <SelectValue placeholder="All Programs">
                {selectedProgramId === "all"
                  ? "All Programs"
                  : programs.find((p) => p.id === selectedProgramId)?.name ??
                    "All Programs"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programsLoading ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Loading programs...
                </div>
              ) : programs.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground">
                  No programs found
                </div>
              ) : (
                programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Course Filter */}
          {selectedProgramId !== "all" && courses.length > 0 && (
            <Select
              value={selectedCourseId}
              onValueChange={(v) => setSelectedCourseId(v ?? "all")}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Courses">
                  {selectedCourseId === "all"
                    ? "All Courses"
                    : courses.find((c) => c.id === selectedCourseId)?.name ??
                      "All Courses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Strand Filter */}
          {selectedProgramId !== "all" && strands.length > 0 && (
            <Select
              value={selectedStrandId}
              onValueChange={(v) => setSelectedStrandId(v ?? "all")}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Strands">
                  {selectedStrandId === "all"
                    ? "All Strands"
                    : strands.find((s) => s.id === selectedStrandId)?.name ??
                      "All Strands"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strands</SelectItem>
                {strands.map((strand) => (
                  <SelectItem key={strand.id} value={strand.id}>
                    {strand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Level Filter - NOT shown, as it's handled by course/strand */}
        </>
      )}
    </div>
  );
}
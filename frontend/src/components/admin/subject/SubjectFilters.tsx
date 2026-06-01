// frontend\src\components\admin\subject\SubjectFilters.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { FiltersState, FiltersActions } from "./hooks/useSubjectFilters";
import type { Program } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { Course } from "@/types/admin/course.types";
import type { Strand } from "@/types/admin/strand.types";

interface SubjectFiltersProps extends FiltersState, FiltersActions {
  programs: Program[];
  levels: Level[];
  courses: Course[];
  strands: Strand[];
  programsLoading: boolean;
  levelsLoading: boolean;
}

export function SubjectFilters({
  selectedSchoolYearId,
  selectedProgramId,
  setSelectedProgramId,
  filterLevelId,
  setFilterLevelId,
  selectedCourseId,
  setSelectedCourseId,
  selectedStrandId,
  setSelectedStrandId,
  programs,
  levels,
  courses,
  strands,
  programsLoading,
  levelsLoading,
}: SubjectFiltersProps) {
  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const isCollege = selectedProgram?.type === "college";
  const isSHS = selectedProgram?.type === "shs";
  const hasSubGroups = isCollege || isSHS;

  const subGroupSatisfied =
    !hasSubGroups ||
    (isCollege ? selectedCourseId !== "all" : selectedStrandId !== "all");

  const levelSelectEnabled = selectedProgramId !== "all" && subGroupSatisfied;

  const visibleLevels = (() => {
    if (!levelSelectEnabled) return [];
    // Levels are already scoped by the API (course/strand/program)
    return levels;
  })();

  const selectedLevelName = levels.find((l) => l.id === filterLevelId)?.name;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {selectedSchoolYearId && (
        <>
          {/* Program */}
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
                  : (programs.find((p) => p.id === selectedProgramId)?.name ??
                    "All Programs")}
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

          {/* Course — college only */}
          {isCollege && (
            <Select
              value={selectedCourseId}
              onValueChange={(v) => {
                setSelectedCourseId(v ?? "all");
                setSelectedStrandId("all");
                setFilterLevelId("all");
              }}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="All Courses">
                  {selectedCourseId === "all"
                    ? "All Courses"
                    : (courses.find((c) => c.id === selectedCourseId)?.name ??
                      "All Courses")}
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

          {/* Strand — SHS only */}
          {isSHS && (
            <Select
              value={selectedStrandId}
              onValueChange={(v) => {
                setSelectedStrandId(v ?? "all");
                setSelectedCourseId("all");
                setFilterLevelId("all");
              }}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder="All Strands">
                  {selectedStrandId === "all"
                    ? "All Strands"
                    : (strands.find((s) => s.id === selectedStrandId)?.name ??
                      "All Strands")}
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

          {/* Level — gated on program + sub-group */}
          <Select
            value={filterLevelId}
            onValueChange={(v) => setFilterLevelId(v ?? "all")}
            disabled={!levelSelectEnabled}
          >
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue
                placeholder={
                  selectedProgramId === "all"
                    ? "Select program first"
                    : hasSubGroups && !subGroupSatisfied
                      ? isCollege
                        ? "Select course first"
                        : "Select strand first"
                      : "All Levels"
                }
              >
                {filterLevelId === "all"
                  ? selectedProgramId === "all"
                    ? "Select program first"
                    : hasSubGroups && !subGroupSatisfied
                      ? isCollege
                        ? "Select course first"
                        : "Select strand first"
                      : "All Levels"
                  : (selectedLevelName ?? "All Levels")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {levelsLoading ? (
                <div className="p-2 text-sm text-muted-foreground">
                  Loading levels...
                </div>
              ) : (
                <>
                  <SelectItem value="all">All Levels</SelectItem>
                  {visibleLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
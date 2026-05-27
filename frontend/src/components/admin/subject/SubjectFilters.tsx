// frontend\src\components\admin\subject\SubjectFilters.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
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
const hasCourses = courses.length > 0;
const hasStrands = strands.length > 0;

// Levels are filtered based on the selected course or strand
const visibleLevels = (() => {
  if (selectedProgramId === "all") return [];
  // If course is selected, levels are already course-scoped via the API
  if (selectedCourseId !== "all") return levels;
  // If strand is selected, levels are already strand-scoped via the API
  if (selectedStrandId !== "all") return levels;
  // Fallback: program-scoped levels
  return levels.filter((l) => l.program_id === selectedProgramId);
})();

const showLevels =
  selectedProgramId !== "all" && visibleLevels.length > 0;

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

          {/* Course — shown only when the program has courses */}
          {selectedProgramId !== "all" && hasCourses && (
            <Select
              value={selectedCourseId}
              onValueChange={(v) => {
                setSelectedCourseId(v ?? "all");
                setSelectedStrandId("all"); // mutually exclusive with strand
                setFilterLevelId("all");
              }}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
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

          {/* Strand — shown only when the program has strands */}
          {selectedProgramId !== "all" && hasStrands && (
            <Select
              value={selectedStrandId}
              onValueChange={(v) => {
                setSelectedStrandId(v ?? "all");
                setSelectedCourseId("all"); // mutually exclusive with course
                setFilterLevelId("all");
              }}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
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

          {/* Level — shown after course/strand is picked, or directly if program has neither */}
          {showLevels && (
            <Select
              value={filterLevelId}
              onValueChange={(v) => setFilterLevelId(v ?? "all")}
            >
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="All Levels">
                  {filterLevelId === "all"
                    ? "All Levels"
                    : (visibleLevels.find((l) => l.id === filterLevelId)
                        ?.name ?? "All Levels")}
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
                    {visibleLevels.map((level) => {
                      const match = level.name.match(/^(\d+)/);
                      const idx = match ? (parseInt(match[1]) - 1) % WEEK_COLORS.length : 0;
                      return (
                        <SelectItem key={level.id} value={level.id}>
                          <div className="flex items-center gap-2">
                            <span>{level.name}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", WEEK_COLORS[idx])}>
                              {match?.[1] ?? ""}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
}
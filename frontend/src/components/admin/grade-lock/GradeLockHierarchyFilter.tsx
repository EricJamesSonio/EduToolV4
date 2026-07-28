"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { programApi } from "@/api/admin/program.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
import { levelApi } from "@/api/admin/level.api";

import type { SchoolYear } from "@/types/admin/school-year.types";

interface GradeLockHierarchyFilterProps {
  schoolYears: SchoolYear[];
  schoolYearsLoading: boolean;

  selectedSchoolYearId: string;
  selectedProgram: string;
  selectedCourseStrand: string;
  selectedLevel: string;

  filteredCount: number;

  onSchoolYearSelect: (id: string | null) => void;
  onProgramChange: (value: string) => void;
  onCourseStrandChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onReset: () => void;
}

export function GradeLockHierarchyFilter({
  schoolYears,
  schoolYearsLoading,
  selectedSchoolYearId,
  selectedProgram,
  selectedCourseStrand,
  selectedLevel,
  filteredCount,
  onSchoolYearSelect,
  onProgramChange,
  onCourseStrandChange,
  onLevelChange,
  onReset,
}: GradeLockHierarchyFilterProps): React.JSX.Element {

  // ───────────────────────── PROGRAMS
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs", selectedSchoolYearId],
    queryFn: () => programApi.getAll(selectedSchoolYearId),
    enabled: !!selectedSchoolYearId,
  });

  const selectedProgramObj = programs.find(p => p.id === selectedProgram);

  // ───────────────────────── COURSES
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses", selectedSchoolYearId, selectedProgram],
    queryFn: () =>
      courseApi.getAll({
        schoolYearId: selectedSchoolYearId,
        programId: selectedProgram,
      }),
    enabled: !!selectedSchoolYearId && !!selectedProgram,
  });

  const selectedCourseObj = courses.find(c => c.id === selectedCourseStrand);

  // ───────────────────────── STRANDS
  const { data: strands = [], isLoading: loadingStrands } = useQuery({
    queryKey: ["strands", selectedProgram],
    queryFn: () =>
      strandApi.getAll({
        program_id: selectedProgram,
      }),
    enabled: !!selectedProgram,
  });

  const safeStrands = Array.isArray(strands) ? strands : [];
  const selectedStrandObj = safeStrands.find(s => s.id === selectedCourseStrand);

  // ───────────────────────── LEVELS
  const { data: levels = [], isLoading: loadingLevels } = useQuery({
    queryKey: ["levels", selectedSchoolYearId],
    queryFn: () => levelApi.getBySchoolYear(selectedSchoolYearId),
    enabled: !!selectedSchoolYearId,
  });

  const safeLevels = Array.isArray(levels) ? levels : [];
  const selectedLevelObj = safeLevels.find(l => l.id === selectedLevel);

  const hasCourseStrand =
    courses.length > 0 || safeStrands.length > 0;

  const levelStepReady =
    selectedProgram &&
    (!hasCourseStrand || selectedCourseStrand);

  if (schoolYearsLoading || loadingPrograms) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap gap-3 items-center">

        {/* SCHOOL YEAR */}
        <SchoolYearSelector
          schoolYears={schoolYears ?? []}
          isLoading={schoolYearsLoading}
          selectedId={selectedSchoolYearId}
          onSelect={onSchoolYearSelect}
        />

        {/* PROGRAM */}
        {selectedSchoolYearId && (
          loadingPrograms ? (
            <Skeleton className="h-9 w-44" />
          ) : (
            <Select value={selectedProgram} onValueChange={onProgramChange}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  {selectedProgramObj?.name ?? "Select Program"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* COURSE */}
        {selectedProgram && courses.length > 0 && (
          loadingCourses ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <Select value={selectedCourseStrand} onValueChange={onCourseStrandChange}>
              <SelectTrigger className="w-56">
                <SelectValue>
                  {selectedCourseObj?.name ?? "Select Course"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* STRAND */}
        {selectedProgram && safeStrands.length > 0 && (
          loadingStrands ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <Select value={selectedCourseStrand} onValueChange={onCourseStrandChange}>
              <SelectTrigger className="w-56">
                <SelectValue>
                  {selectedStrandObj?.name ?? "Select Strand"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {safeStrands.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* LEVEL */}
        {levelStepReady && (
          loadingLevels ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <Select value={selectedLevel} onValueChange={onLevelChange}>
              <SelectTrigger className="w-40">
                <SelectValue>
                  {selectedLevelObj?.name ?? "Select Level"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {safeLevels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* RESET */}
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset
        </Button>

      </div>

      <div className="text-sm text-muted-foreground not-interactive">
        Showing {filteredCount} class{filteredCount !== 1 ? "es" : ""}
      </div>

    </div>
  );
}
// ===== File: frontend\src\components\admin\grade-lock\GradeLockHierarchyFilter.tsx =====
"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { programApi } from "@/api/admin/program.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
import { levelApi } from "@/api/admin/level.api";

interface GradeLockHierarchyFilterProps {
  selectedSchoolYearId: string;
  selectedProgram: string;
  selectedCourseStrand: string;
  selectedLevel: string;

  filteredCount: number;

  onProgramChange: (value: string) => void;
  onCourseStrandChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onReset: () => void;
}

export function GradeLockHierarchyFilter({
  selectedSchoolYearId,
  selectedProgram,
  selectedCourseStrand,
  selectedLevel,
  filteredCount,
  onProgramChange,
  onCourseStrandChange,
  onLevelChange,
  onReset,
}: GradeLockHierarchyFilterProps): React.JSX.Element {

  const { data: programs = [], isLoading: loadingPrograms } = useAsyncQuery(
    queryKeys.admin.programs.list({ selectedSchoolYearId }),
    () => programApi.getAll(selectedSchoolYearId),
    { enabled: !!selectedSchoolYearId },
  );

  const selectedProgramObj = programs.find(p => p.id === selectedProgram);

  const { data: courses = [], isLoading: loadingCourses } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId: selectedSchoolYearId, programId: selectedProgram }),
    () =>
      courseApi.getAll({
        schoolYearId: selectedSchoolYearId,
        programId: selectedProgram,
      }),
    { enabled: !!selectedSchoolYearId && !!selectedProgram },
  );

  const selectedCourseObj = courses.find(c => c.id === selectedCourseStrand);

  const { data: strands = [], isLoading: loadingStrands } = useAsyncQuery(
    queryKeys.admin.strands.list({ program_id: selectedProgram }),
    () =>
      strandApi.getAll({
        program_id: selectedProgram,
      }),
    { enabled: !!selectedProgram },
  );

  const safeStrands = Array.isArray(strands) ? strands : [];
  const selectedStrandObj = safeStrands.find(s => s.id === selectedCourseStrand);

  const { data: levels = [], isLoading: loadingLevels } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: selectedSchoolYearId }),
    () => levelApi.getBySchoolYear(selectedSchoolYearId),
    { enabled: !!selectedSchoolYearId },
  );

  const safeLevels = Array.isArray(levels) ? levels : [];
  const selectedLevelObj = safeLevels.find(l => l.id === selectedLevel);

  const hasCourseStrand =
    courses.length > 0 || safeStrands.length > 0;

  const levelStepReady =
    selectedProgram &&
    (!hasCourseStrand || selectedCourseStrand);

  if (loadingPrograms) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap gap-3 items-center">

        {selectedSchoolYearId && (
          loadingPrograms ? (
            <Skeleton className="h-9 w-44" />
          ) : (
            <Select value={selectedProgram} onValueChange={(v) => { if (v !== null) onProgramChange(v); }}>
              <SelectTrigger className="w-44">
                <SelectValue>
                  {selectedProgramObj?.name ?? "Select Department"}
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

        {selectedProgram && courses.length > 0 && (
          loadingCourses ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <Select value={selectedCourseStrand} onValueChange={(v) => { if (v !== null) onCourseStrandChange(v); }}>
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

        {selectedProgram && safeStrands.length > 0 && (
          loadingStrands ? (
            <Skeleton className="h-9 w-56" />
          ) : (
            <Select value={selectedCourseStrand} onValueChange={(v) => { if (v !== null) onCourseStrandChange(v); }}>
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

        {levelStepReady && (
          loadingLevels ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <Select value={selectedLevel} onValueChange={(v) => { if (v !== null) onLevelChange(v); }}>
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
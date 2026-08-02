"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi }    from "@/api/admin/program.api";
import { courseApi }     from "@/api/admin/course.api";
import { strandApi }     from "@/api/admin/strand.api";
import { levelApi }      from "@/api/admin/level.api";
import { sectionApi }    from "@/api/admin/section.api";
import type { Level }    from "@/types/admin/level.types";
import type { ProgramType } from "@/types/admin/program.types";

export interface HierarchySelection {
  schoolYearId?: string;
  programId?:    string;
  courseId?:     string;
  strandId?:     string;
  levelId?:      string;
  sectionId?:    string;
}

interface Props {
  value:    HierarchySelection;
  onChange: (next: HierarchySelection) => void;
}

const ALL = "__all__";

const USES_COURSES = new Set<ProgramType>(["college"]);
const USES_STRANDS = new Set<ProgramType>(["shs"]);

function hasCourses(type: ProgramType): boolean { return USES_COURSES.has(type); }
function hasStrands(type: ProgramType): boolean  { return USES_STRANDS.has(type); }

export function StudentHierarchyFilter({ value, onChange }: Props): React.JSX.Element {

  const { data: schoolYears = [], isLoading: loadingSY } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
    { meta: { preset: 'list' } },
  );

  const { data: programs = [], isLoading: loadingPrograms } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: value.schoolYearId }),
    () => programApi.getAll(value.schoolYearId!),
    { enabled:  !!value.schoolYearId, meta: { preset: 'list' } },
  );

  const selectedProgram = programs.find((p) => p.id === value.programId);
  const programType     = selectedProgram?.type;

  const { data: courses = [], isLoading: loadingCourses } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId: value.schoolYearId, programId: value.programId }),
    () => courseApi.getAll({ schoolYearId: value.schoolYearId!, programId: value.programId }),
    { enabled:  !!value.schoolYearId && !!value.programId && !!programType && hasCourses(programType), meta: { preset: 'list' } },
  );

  const { data: strands = [], isLoading: loadingStrands } = useAsyncQuery(
    queryKeys.admin.strands.list({ program_id: value.programId }),
    () => strandApi.getAll({ program_id: value.programId }),
    { enabled:  !!value.programId && !!programType && hasStrands(programType), meta: { preset: 'list' } },
  );

  const levelsEnabled = (() => {
    if (!value.schoolYearId || !value.programId || !programType) return false;
    if (hasCourses(programType)) return !!value.courseId;
    if (hasStrands(programType)) return !!value.strandId;
    return true;
  })();

  const { data: levels = [], isLoading: loadingLevels } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: value.schoolYearId, programId: value.programId }),
    () => levelApi.getBySchoolYear(value.schoolYearId!),
    {
      enabled:  levelsEnabled,
      meta: { preset: 'list' },
      select: (all: Level[]) => all.filter((l) => l.program_id === value.programId),
    },
  );

  const { data: sections = [], isLoading: loadingSections } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: value.schoolYearId, levelId: value.levelId }),
    () => sectionApi.getAll(value.schoolYearId!, value.levelId),
    {
      enabled:  !!value.schoolYearId && !!value.levelId,
      meta: { preset: 'list' },
      select: (all: any[]) => {
        if (value.courseId) return all.filter((s) => s.course_id === value.courseId);
        if (value.strandId) return all.filter((s) => s.strand_id === value.strandId);
        return all;
      },
    },
  );

  // ── Derived labels for trigger display ───────────────────────────────────
  const selectedSY      = schoolYears.find((s) => s.id === value.schoolYearId);
  const selectedCourse  = courses.find((c) => c.id === value.courseId);
  const selectedStrand  = strands.find((s) => s.id === value.strandId);
  const selectedLevel   = levels.find((l) => l.id === value.levelId);
  const selectedSection = sections.find((s) => s.id === value.sectionId);

  function selectSchoolYear(id: string): void {
    onChange({ schoolYearId: id === ALL ? undefined : id });
  }
  function selectProgram(id: string): void {
    onChange({ schoolYearId: value.schoolYearId, programId: id === ALL ? undefined : id });
  }
  function selectCourse(id: string): void {
    onChange({ schoolYearId: value.schoolYearId, programId: value.programId, courseId: id === ALL ? undefined : id });
  }
  function selectStrand(id: string): void {
    onChange({ schoolYearId: value.schoolYearId, programId: value.programId, strandId: id === ALL ? undefined : id });
  }
  function selectLevel(id: string): void {
    onChange({
      schoolYearId: value.schoolYearId,
      programId:    value.programId,
      courseId:     value.courseId,
      strandId:     value.strandId,
      levelId:      id === ALL ? undefined : id,
    });
  }
  function selectSection(id: string): void {
    onChange({ ...value, sectionId: id === ALL ? undefined : id });
  }

  if (loadingSY) return <Skeleton className="h-9 w-48" />;

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* School Year */}
      <Select value={value.schoolYearId ?? ALL} onValueChange={(v) => { if (v !== null) selectSchoolYear(v); }}>
        <SelectTrigger className="w-48 h-9 text-sm">
          <span className="truncate text-sm">
            {selectedSY
              ? `${selectedSY.name}${selectedSY.status === "active" ? " (Active)" : ""}`
              : "All School Years"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All School Years</SelectItem>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              {sy.name}{sy.status === "active" && " (Active)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Program */}
      {value.schoolYearId && (
        loadingPrograms ? <Skeleton className="h-9 w-44" /> : (
          <Select value={value.programId ?? ALL} onValueChange={(v) => { if (v !== null) selectProgram(v); }}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <span className="truncate text-sm">
                {selectedProgram ? selectedProgram.name : "All Programs"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {/* Course — college only */}
      {value.programId && programType && hasCourses(programType) && (
        loadingCourses ? <Skeleton className="h-9 w-44" /> : (
          <Select value={value.courseId ?? ALL} onValueChange={(v) => { if (v !== null) selectCourse(v); }}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <span className="truncate text-sm">
                {selectedCourse ? selectedCourse.name : "All Courses"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {/* Strand — shs only */}
      {value.programId && programType && hasStrands(programType) && (
        loadingStrands ? <Skeleton className="h-9 w-40" /> : (
          <Select value={value.strandId ?? ALL} onValueChange={(v) => { if (v !== null) selectStrand(v); }}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <span className="truncate text-sm">
                {selectedStrand ? selectedStrand.name : "All Strands"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Strands</SelectItem>
              {strands.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {/* Level */}
      {levelsEnabled && (
        loadingLevels ? <Skeleton className="h-9 w-36" /> : (
          <Select value={value.levelId ?? ALL} onValueChange={(v) => { if (v !== null) selectLevel(v); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <span className="truncate text-sm">
                {selectedLevel ? selectedLevel.name : "All Levels"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Levels</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {/* Section */}
      {value.levelId && (
        loadingSections ? <Skeleton className="h-9 w-36" /> : (
          <Select value={value.sectionId ?? ALL} onValueChange={(v) => { if (v !== null) selectSection(v); }}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <span className="truncate text-sm">
                {selectedSection ? selectedSection.name : "All Sections"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

    </div>
  );
}
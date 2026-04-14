"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi }    from "@/api/admin/program.api";
import { courseApi }     from "@/api/admin/course.api";
import { strandApi }     from "@/api/admin/strand.api";
import { levelApi }      from "@/api/admin/level.api";
import { sectionApi }    from "@/api/admin/section.api";
import type { ProgramType } from "@/types/admin/program.types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HierarchySelection {
  schoolYearId?: string;
  programId?:    string;
  /** populated only when program type === "college" */
  courseId?:     string;
  /** populated only when program type === "shs" */
  strandId?:     string;
  levelId?:      string;
  sectionId?:    string;
}

interface Props {
  value:    HierarchySelection;
  onChange: (next: HierarchySelection) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL = "__all__";

/** Program types that use Courses as the second-level filter */
const USES_COURSES  = new Set<ProgramType>(["college"]);
/** Program types that use Strands as the second-level filter */
const USES_STRANDS  = new Set<ProgramType>(["shs"]);

function hasCourses(type: ProgramType): boolean { return USES_COURSES.has(type); }
function hasStrands(type: ProgramType): boolean  { return USES_STRANDS.has(type); }

// ─── Component ───────────────────────────────────────────────────────────────

export function StudentHierarchyFilter({ value, onChange }: Props): React.JSX.Element {

  // ── School Years ────────────────────────────────────────────────────────
  const { data: schoolYears = [], isLoading: loadingSY } = useQuery({
    queryKey: ["school-years"],
    queryFn:  schoolYearApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select active school year on first load
  useEffect(() => {
    if (value.schoolYearId || schoolYears.length === 0) return;
    const active = schoolYears.find((sy) => sy.status === "active");
    onChange({ schoolYearId: active?.id ?? schoolYears[0].id });
  }, [schoolYears]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Programs ────────────────────────────────────────────────────────────
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs", value.schoolYearId],
    queryFn:  () => programApi.getAll(value.schoolYearId!),
    enabled:  !!value.schoolYearId,
    staleTime: 5 * 60 * 1000,
  });

  const selectedProgram = programs.find((p) => p.id === value.programId);
  const programType     = selectedProgram?.type;

  // ── Courses (college only) ──────────────────────────────────────────────
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses", value.schoolYearId, value.programId],
    queryFn:  () =>
      courseApi.getAll({ schoolYearId: value.schoolYearId!, programId: value.programId }),
    enabled:  !!value.schoolYearId && !!value.programId && !!programType && hasCourses(programType),
    staleTime: 5 * 60 * 1000,
  });

  // ── Strands (shs only) ──────────────────────────────────────────────────
  const { data: strands = [], isLoading: loadingStrands } = useQuery({
    queryKey: ["strands", value.programId],
    queryFn:  () => strandApi.getAll({ program_id: value.programId }),
    enabled:  !!value.programId && !!programType && hasStrands(programType),
    staleTime: 5 * 60 * 1000,
  });

  // ── Levels ──────────────────────────────────────────────────────────────
  // Levels become available once we've passed the course/strand gate (if any)
  const levelsEnabled = (() => {
    if (!value.schoolYearId || !value.programId || !programType) return false;
    if (hasCourses(programType)) return !!value.courseId;
    if (hasStrands(programType)) return !!value.strandId;
    return true; // other types go straight to levels
  })();

  const { data: levels = [], isLoading: loadingLevels } = useQuery({
    queryKey: ["levels", value.schoolYearId, value.programId],
    queryFn:  () => levelApi.getBySchoolYear(value.schoolYearId!),
    enabled:  levelsEnabled,
    staleTime: 5 * 60 * 1000,
    select: (all) => all.filter((l) => l.program_id === value.programId),
  });

  // ── Sections ────────────────────────────────────────────────────────────
  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ["sections", value.schoolYearId, value.levelId],
    queryFn:  () => sectionApi.getAll(value.schoolYearId!, value.levelId),
    enabled:  !!value.schoolYearId && !!value.levelId,
    staleTime: 5 * 60 * 1000,
    // Further filter sections by courseId / strandId client-side
    select: (all) => {
      if (value.courseId) return all.filter((s) => s.course_id === value.courseId);
      if (value.strandId) return all.filter((s) => s.strand_id === value.strandId);
      return all;
    },
  });

  // ── Cascade helpers ─────────────────────────────────────────────────────

  function selectSchoolYear(id: string): void {
    onChange({ schoolYearId: id }); // reset everything below
  }

  function selectProgram(id: string): void {
    onChange({ schoolYearId: value.schoolYearId, programId: id === ALL ? undefined : id });
  }

  function selectCourse(id: string): void {
    onChange({
      schoolYearId: value.schoolYearId,
      programId:    value.programId,
      courseId:     id === ALL ? undefined : id,
    });
  }

  function selectStrand(id: string): void {
    onChange({
      schoolYearId: value.schoolYearId,
      programId:    value.programId,
      strandId:     id === ALL ? undefined : id,
    });
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
    onChange({
      ...value,
      sectionId: id === ALL ? undefined : id,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (loadingSY) return <Skeleton className="h-9 w-48" />;

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* School Year */}
      <Select
        value={value.schoolYearId ?? ALL}
        onValueChange={selectSchoolYear}
      >
        <SelectTrigger className="w-44 h-9 text-sm">
          <SelectValue placeholder="School Year" />
        </SelectTrigger>
        <SelectContent>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              {sy.name}
              {sy.status === "active" && " (Active)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Program */}
      {value.schoolYearId && (
        loadingPrograms ? <Skeleton className="h-9 w-40" /> : (
          <Select
            value={value.programId ?? ALL}
            onValueChange={selectProgram}
          >
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="All Programs" />
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
        loadingCourses ? <Skeleton className="h-9 w-40" /> : (
          <Select
            value={value.courseId ?? ALL}
            onValueChange={selectCourse}
          >
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="All Courses" />
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
          <Select
            value={value.strandId ?? ALL}
            onValueChange={selectStrand}
          >
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="All Strands" />
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
          <Select
            value={value.levelId ?? ALL}
            onValueChange={selectLevel}
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="All Levels" />
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
          <Select
            value={value.sectionId ?? ALL}
            onValueChange={selectSection}
          >
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="All Sections" />
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
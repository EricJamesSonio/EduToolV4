// frontend/src/hooks/admin/useSectionContext.ts
// Resolves a section's full context: the section itself plus its School Year,
// Program, Course/Strand, and Level. Shared by the program-context and admin
// section detail pages.

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { sectionApi } from "@/api/admin/section.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useEnrichedLevels } from "@/hooks/admin/useEnrichedLevels";

import type { Section } from "@/types/admin/section.types";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

export interface SectionContextResult {
  section: Section | null;
  isLoading: boolean;
  level: EnrichedLevel | null;
  program: {
    id: string;
    name: string;
    type: string;
  } | null;
  course: CourseSnapshot | null;
  strand: StrandSnapshot | null;
  schoolYearName: string;
}

export function useSectionContext(
  schoolYearId: string | null,
  sectionId: string | null,
): SectionContextResult {
  const enabled = !!schoolYearId;

  // Use a dedicated cache key (not the shared `sections.list` key) so the detail
  // page always fetches the full section list fresh instead of reusing a
  // possibly-stale/empty cached list from another page (which caused the section
  // to appear "not found" until a full reload).
  const sectionsKey = [
    ...queryKeys.admin.sections.all,
    "detail-lookup",
    schoolYearId ?? "none",
  ] as const;

  const { data: sections = [], isLoading: sectionsLoading } = useAsyncQuery(
    sectionsKey,
    () => sectionApi.getAll(schoolYearId!),
    { enabled },
  );

  const { data: schoolYears = [] } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const { levels, isLoading: levelsLoading } = useEnrichedLevels(schoolYearId);

  const schoolYearName =
    schoolYears.find((sy) => sy.id === schoolYearId)?.name ?? "";

  const section = enabled && sectionId
    ? sections.find((s) => s.id === sectionId) ?? null
    : null;

  const level = section
    ? levels.find((l) => l.id === section.level_id) ?? null
    : null;

  const program = level
    ? { id: level.program_id, name: level.programName, type: level.programType }
    : null;

  const course = level && section?.course_id
    ? (level.courses ?? []).find((c) => c.id === section.course_id) ?? null
    : null;

  const strand = level && section?.strand_id
    ? (level.strands ?? []).find((s) => s.id === section.strand_id) ?? null
    : null;

  return {
    section,
    isLoading: sectionsLoading || levelsLoading,
    level,
    program,
    course,
    strand,
    schoolYearName,
  };
}
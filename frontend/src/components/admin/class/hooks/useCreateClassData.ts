import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";

import { educatorApi }          from "@/api/admin/educator.api";
import { subjectApi }          from "@/api/admin/subject.api";
import { programApi }          from "@/api/admin/program.api";
import { courseApi }           from "@/api/admin/course.api";
import { strandApi }           from "@/api/admin/strand.api";
import { levelApi }            from "@/api/admin/level.api";
import { sectionApi }          from "@/api/admin/section.api";
import { semesterApi }         from "@/api/admin/semester.api";
import { semesterTemplateApi } from "@/api/admin/semester-template.api";
import { classApi }            from "@/api/admin/class.api";
import type { Level }          from "@/types/admin/level.types";
import type { Subject }        from "@/types/admin/subject.types";
import { toArray }             from "@/utils/classes.utils";
import { queryKeys }           from "@/hooks/queryKeys.factory";

export function useCreateClassData(
  schoolYearId: string | null,
  selectedProgramId: string,
  selectedSemesterId: string,
  selectedTrackId: string,
  selectedLevelId: string,
  selectedEducatorId: string,
  isEnabled: boolean,
) {
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list({}),
    () => educatorApi.getAll(),
    { staleTime: 5 * 60 * 1000 },
  );
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  const { data: coursesRaw } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId, programId: selectedProgramId! }),
    () => courseApi.getAll({ schoolYearId: schoolYearId!, programId: selectedProgramId! }),
    { enabled: !!schoolYearId && !!selectedProgramId },
  );

  // NOTE: strand.findAll on the backend short-circuits to [] whenever
  // schoolYearId is missing (see strand.service.ts), so schoolYearId is
  // required here — omitting it (as before) silently returned zero strands
  // for every program, which is what made hasTrack always false for SHS.
  const { data: strandsRaw } = useAsyncQuery(
    queryKeys.admin.strands.list({ schoolYearId, program_id: selectedProgramId! }),
    () => strandApi.getAll({ schoolYearId: schoolYearId!, program_id: selectedProgramId! }),
    { enabled: !!schoolYearId && !!selectedProgramId },
  );

  const courses       = toArray<{ id: string; name: string }>(coursesRaw);
  const strands       = toArray<{ id: string; name: string }>(strandsRaw);
  const tracks        = courses.length > 0 ? courses : strands;
  const hasTrack      = tracks.length > 0;
  const isCourseTrack = courses.length > 0;

  // ── Levels ────────────────────────────────────────────────────────────────
  // IMPORTANT: which level.api method we call depends on whether this
  // department has courses/strands (hasTrack) and whether one is selected yet.
  //
  // The backend's GET /levels?schoolYearId=&programId= route (levelApi.getBySchoolYear
  // with a programId) hits LevelController's "programId && schoolYearId" branch,
  // which calls levelService.getByProgram -> findByProgramAndSchoolYear. That
  // repository method explicitly filters `course_id: null, strand_id: null` —
  // i.e. it ONLY returns "bare" department-level levels (daycare/kinder/
  // elementary/jhs, which have no course/strand split). For College/SHS, every
  // level has a course_id or strand_id set, so hitting that endpoint always
  // returned [] regardless of which course/strand was picked — that was the
  // actual bug, not a client-side filtering issue.
  //
  // The fix: once a track is selected, call the endpoints that are actually
  // built for that case — getByCourse / getByStrand — which query by
  // course_id/strand_id directly and correctly return the seeded levels.
  const { data: levelsRaw } = useAsyncQuery(
    queryKeys.admin.levels.list({
      schoolYearId,
      programId: selectedProgramId,
      trackId: selectedTrackId || null,
      isCourseTrack,
    }),
    () => {
      if (hasTrack && selectedTrackId) {
        return isCourseTrack
          ? levelApi.getByCourse(schoolYearId!, selectedTrackId)
          : levelApi.getByStrand(schoolYearId!, selectedTrackId);
      }
      // No track needed (daycare/kinder/elementary/jhs) — this path correctly
      // hits the program-scoped, course/strand-null-filtered endpoint.
      return levelApi.getBySchoolYear(schoolYearId!, selectedProgramId || undefined);
    },
    {
      // Don't fetch at all once we know a track is required but not chosen yet
      // (hasTrack && !selectedTrackId) — there is nothing valid to show until
      // then, and hitting the program-only endpoint in that state would just
      // return [] anyway (or, worse, an unrelated program-level level).
      enabled:
        !!schoolYearId &&
        !!selectedProgramId &&
        (!hasTrack || !!selectedTrackId),
    },
  );
  const levels = useMemo<Level[]>(() => {
    const all = toArray<Level>(levelsRaw);
    if (!selectedProgramId) return [];
    // The dedicated endpoints above already scope by course/strand/program
    // correctly, so this is just a defensive extra filter, not the primary
    // scoping mechanism it used to be.
    return all.filter((l) => l.program_id === selectedProgramId);
  }, [levelsRaw, selectedProgramId]);

  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId, levelId: selectedLevelId! }),
    () => sectionApi.getAll(schoolYearId!, selectedLevelId!),
    { enabled: !!schoolYearId && !!selectedLevelId },
  );
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.list({
      levelId: selectedLevelId!,
      ...(selectedTrackId && isCourseTrack ? { courseId: selectedTrackId } : {}),
      ...(selectedTrackId && !isCourseTrack ? { strandId: selectedTrackId } : {}),
    }),
    () => subjectApi.getAll({
      levelId: selectedLevelId!,
      ...(selectedTrackId && isCourseTrack  ? { courseId: selectedTrackId } : {}),
      ...(selectedTrackId && !isCourseTrack ? { strandId: selectedTrackId } : {}),
    }),
    { enabled: !!selectedLevelId },
  );
  const subjects = toArray<Subject>(subjectsRaw);

  const { data: templateAssignments = [], isLoading: templateAssignmentsLoading } = useAsyncQuery(
    queryKeys.admin.semesterTemplateAssignments.list(schoolYearId!),
    () => semesterTemplateApi.getAssignmentsBySchoolYear(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  const assignedProgramIds = useMemo(
    () => new Set(templateAssignments.map((a) => a.program_id)),
    [templateAssignments],
  );

  // Only trust this once the assignments query has actually resolved —
  // otherwise assignedProgramIds is momentarily empty on every program
  // change and this flips true->false a beat later, which is what caused
  // the "No template assigned" warning + semester field to flash before
  // settling on the correct state.
  const programMissingTemplate =
    !!selectedProgramId && !templateAssignmentsLoading && !assignedProgramIds.has(selectedProgramId);

  const { data: semesters = [] } = useAsyncQuery(
    [...queryKeys.admin.semesters.all, 'by-program', selectedProgramId, schoolYearId] as const,
    () => semesterApi.getByProgram(selectedProgramId!, schoolYearId!),
    { enabled: !!schoolYearId && !!selectedProgramId && !programMissingTemplate && isEnabled },
  );

  // Existing classes of the chosen educator in this school year. Rendered as
  // the educator's schedule grid and used to block already-taken day/time
  // cells. Scoped identically to the backend's assertNoEducatorConflict (org +
  // educator + school year, archived classes excluded server-side).
  const { data: educatorClasses, isLoading: educatorClassesLoading } = useAsyncQuery(
    queryKeys.admin.classes.list({ schoolYearId, educatorId: selectedEducatorId }),
    () => classApi.getAll({ schoolYearId: schoolYearId!, educatorId: selectedEducatorId }),
    { enabled: !!schoolYearId && !!selectedEducatorId, staleTime: 5 * 60 * 1000 },
  );

  return {
    programs,
    courses,
    strands,
    tracks,
    hasTrack,
    isCourseTrack,
    levels,
    sections,
    subjects,
    templateAssignments,
    assignedProgramIds,
    programMissingTemplate,
    templateAssignmentsLoading,
    semesters,
    educators,
    educatorClasses,
    educatorClassesLoading,
  };
}
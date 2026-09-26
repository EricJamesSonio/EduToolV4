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

  // Scoped to program at the query level (not just filtered client-side
  // afterward) so we don't pull every level in the school year on every
  // keystroke/program change.
  const { data: levelsRaw } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId, programId: selectedProgramId }),
    () => levelApi.getBySchoolYear(schoolYearId!, selectedProgramId || undefined),
    { enabled: !!schoolYearId && !!selectedProgramId },
  );
  const levels = useMemo<Level[]>(() => {
    const all = toArray<Level>(levelsRaw);
    if (!selectedProgramId) return [];

    let result = all.filter((l) => l.program_id === selectedProgramId);

    if (hasTrack && selectedTrackId && isCourseTrack) {
      result = result.filter((l) => !l.course_id || l.course_id === selectedTrackId);
    } else if (hasTrack && selectedTrackId && !isCourseTrack) {
      result = result.filter((l) => !l.strand_id || l.strand_id === selectedTrackId);
    } else if (hasTrack && !selectedTrackId) {
      result = result.filter((l) => isCourseTrack ? !l.course_id : !l.strand_id);
    }

    return result;
  }, [levelsRaw, selectedProgramId, hasTrack, isCourseTrack, selectedTrackId]);

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
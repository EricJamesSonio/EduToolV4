import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { subjectApi }          from "@/api/admin/subject.api";
import { educatorApi }         from "@/api/admin/educator.api";
import { programApi }          from "@/api/admin/program.api";
import { courseApi }           from "@/api/admin/course.api";
import { strandApi }           from "@/api/admin/strand.api";
import { levelApi }            from "@/api/admin/level.api";
import { sectionApi }          from "@/api/admin/section.api";
import { semesterApi }         from "@/api/admin/semester.api";
import { semesterTemplateApi } from "@/api/admin/semester-template.api";
import type { Level }          from "@/types/admin/level.types";
import type { Subject }        from "@/types/admin/subject.types";
import { toArray }             from "@/utils/classes.utils";

export function useCreateClassData(
  schoolYearId: string | null,
  selectedProgramId: string,
  selectedSemesterId: string,
  selectedTrackId: string,
  selectedLevelId: string,
  isEnabled: boolean,
) {
  const { data: programsRaw } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId!),
    enabled:  !!schoolYearId,
  });
  const programs = toArray<{ id: string; name: string }>(programsRaw);

  const { data: coursesRaw } = useQuery({
    queryKey: ["admin", "courses", schoolYearId, selectedProgramId],
    queryFn:  () => courseApi.getAll({ schoolYearId: schoolYearId!, programId: selectedProgramId! }),
    enabled:  !!schoolYearId && !!selectedProgramId,
  });

  const { data: strandsRaw } = useQuery({
    queryKey: ["admin", "strands", selectedProgramId],
    queryFn:  () => strandApi.getAll({ program_id: selectedProgramId! }),
    enabled:  !!selectedProgramId,
  });

  const courses       = toArray<{ id: string; name: string }>(coursesRaw);
  const strands       = toArray<{ id: string; name: string }>(strandsRaw);
  const tracks        = courses.length > 0 ? courses : strands;
  const hasTrack      = tracks.length > 0;
  const isCourseTrack = courses.length > 0;

  const { data: levelsRaw } = useQuery({
    queryKey: ["admin", "levels", "school-year", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId!),
    enabled:  !!schoolYearId,
  });
  const levels = useMemo<Level[]>(() => {
    const all = toArray<Level>(levelsRaw);
    if (!selectedProgramId) return [];
    return all.filter((l) => l.program_id === selectedProgramId);
  }, [levelsRaw, selectedProgramId]);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", schoolYearId, selectedLevelId],
    queryFn:  () => sectionApi.getAll(schoolYearId!, selectedLevelId!),
    enabled:  !!schoolYearId && !!selectedLevelId,
  });
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

  const { data: subjectsRaw } = useQuery({
    queryKey: [
      "admin", "subjects", selectedLevelId,
      isCourseTrack ? selectedTrackId : undefined,
      !isCourseTrack ? selectedTrackId : undefined,
    ],
    queryFn: () => subjectApi.getAll({
      levelId: selectedLevelId!,
      ...(selectedTrackId && isCourseTrack  ? { courseId: selectedTrackId } : {}),
      ...(selectedTrackId && !isCourseTrack ? { strandId: selectedTrackId } : {}),
    }),
    enabled: !!selectedLevelId,
  });
  const subjects = toArray<Subject>(subjectsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn:  () => educatorApi.getAll(),
  });
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: templateAssignments = [] } = useQuery({
    queryKey: ["admin", "semester-template-assignments", schoolYearId],
    queryFn:  () => semesterTemplateApi.getAssignmentsBySchoolYear(schoolYearId!),
    enabled:  !!schoolYearId,
  });

  const assignedProgramIds = useMemo(
    () => new Set(templateAssignments.map((a) => a.program_id)),
    [templateAssignments],
  );

  const programMissingTemplate =
    !!selectedProgramId && !assignedProgramIds.has(selectedProgramId);

  const { data: semesters = [] } = useQuery({
    queryKey: ["admin", "semesters", "by-program", selectedProgramId, schoolYearId],
    queryFn:  () => semesterApi.getByProgram(selectedProgramId!, schoolYearId!),
    enabled:  !!schoolYearId && !!selectedProgramId && !programMissingTemplate && isEnabled,
  });

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
    educators,
    templateAssignments,
    assignedProgramIds,
    programMissingTemplate,
    semesters,
  };
}

// frontend/src/components/admin/data-seeder/hooks/useSeederCard.ts
import { useEffect, useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { organizationApi } from "@/api/admin/organization.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
import { levelApi } from "@/api/admin/level.api";
import { subjectApi } from "@/api/admin/subject.api";
import { useSeedState } from "./useSeedState";
import {
  COLLEGE_COURSES,
  LEVEL_DEFS,
  PROGRAMS,
  SHS_STRANDS,
  SECTION_DEFAULTS,
  parseSubjectKey,
} from "../constants/seed-data";

interface PendingSchoolYear {
  name: string;
  start_date?: string;
  end_date?: string;
}

function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) && err.response?.data?.error === "SHORT_DURATION_WARNING"
  );
}

export function useSeederCard() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingSchoolYear, setPendingSchoolYear] =
    useState<PendingSchoolYear | null>(null);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      if (active) setSelectedSchoolYearId(active.id);
    }
  }, [schoolYears, selectedSchoolYearId]);

  const createSchoolYearMutation = useMutationWithInvalidation(
    ({
      name,
      start_date,
      end_date,
      confirm_short_duration,
    }: {
      name: string;
      start_date?: string;
      end_date?: string;
      confirm_short_duration?: boolean;
    }) => schoolYearApi.create({ name, start_date, end_date, confirm_short_duration }),
    {
      invalidateKeys: [queryKeys.admin.schoolYears.all],
      onSuccess: (result) => {
        const created = (result as any).data ?? result;
        toast.success(`School year "${created.name}" created.`);
        setSelectedSchoolYearId(created.id);
        setPendingSchoolYear(null);
      },
      onError: (err: unknown, variables) => {
        if (isShortDurationError(err)) {
          setPendingSchoolYear({
            name: variables.name,
            start_date: variables.start_date,
            end_date: variables.end_date,
          });
          return;
      }
      toast.error("Failed to create school year.");
    },
  });

  function handleConfirmShortDuration() {
    if (!pendingSchoolYear) return;
    createSchoolYearMutation.mutate({ ...pendingSchoolYear, confirm_short_duration: true });
  }

  function handleCreateSchoolYear(name: string, start_date?: string, end_date?: string) {
    createSchoolYearMutation.mutate({ name, start_date, end_date });
  }

  const { data: existingPrograms = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: selectedSchoolYearId! }),
    () => programApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: existingCourses = [] } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId: selectedSchoolYearId! }),
    () => courseApi.getAll({ schoolYearId: selectedSchoolYearId! }),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: existingStrands = [] } = useAsyncQuery(
    queryKeys.admin.strands.list({ schoolYearId: selectedSchoolYearId! }),
    async () => {
      try {
        const result = await strandApi.getAll();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    { enabled: !!selectedSchoolYearId },
  );

  const { data: existingLevels = [] } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: selectedSchoolYearId! }),
    () => levelApi.getBySchoolYear(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: existingSubjects = [] } = useAsyncQuery(
    queryKeys.admin.subjects.list({ schoolYearId: selectedSchoolYearId }),
    () => subjectApi.getAll({ schoolYearId: selectedSchoolYearId ?? undefined }),
    { enabled: !!selectedSchoolYearId },
  );

  const seedState = useSeedState();

  const {
    selectedPrograms,
    setSelectedPrograms,
    selectedCourses,
    setSelectedCourses,
    selectedStrands,
    setSelectedStrands,
    selectedSubjects,
    setSelectedSubjects,
    allSelectableSubjects,
    levelConfigs,
    resolvedGradingScales,
    seedGradingScale,
    gradingSchemesByProgram,
    semesterTemplatesByProgram,
    sectionConfigs,
    seedGradingSchemes,
    seedSemesterTemplates,
    resetAll,
  } = seedState;

  function buildSectionConfigsPayload(): Record<string, { name: string; capacity: number }[]> {
    const payload: Record<string, { name: string; capacity: number }[]> = {};

    for (const prog of selectedPrograms) {
      if (!LEVEL_DEFS[prog]) continue;
      const levelNames = levelConfigs[prog]?.names ?? LEVEL_DEFS[prog];

      if (prog === "college") {
        for (const course of selectedCourses) {
          for (const levelName of levelNames) {
            payload[`${course}|${levelName}`] = sectionConfigs[levelName] ?? SECTION_DEFAULTS;
          }
        }
      } else if (prog === "shs") {
        for (const strand of selectedStrands) {
          for (const levelName of levelNames) {
            payload[`${strand}|${levelName}`] = sectionConfigs[levelName] ?? SECTION_DEFAULTS;
          }
        }
      } else {
        for (const levelName of levelNames) {
          payload[levelName] = sectionConfigs[levelName] ?? SECTION_DEFAULTS;
        }
      }
    }

    return payload;
  }

  const seedMutation = useMutationWithInvalidation(
    organizationApi.seedOrg,
    {
      invalidateKeys: [
        queryKeys.admin.programs.all,
        queryKeys.admin.courses.all,
        queryKeys.admin.strands.all,
        queryKeys.admin.levels.all,
        queryKeys.admin.subjects.all,
      ],
      onSuccess: () => {
        toast.success("Seed completed! Your programs, levels, and subjects are ready.");
        setCollapsed(true);
        resetAll();
      },
      onError: () => toast.error("Seed failed. Please try again."),
    }
  );

  function handleSeed() {
    if (!selectedSchoolYearId) {
      toast.error("Select or create a school year first.");
      return;
    }
    if (selectedPrograms.size === 0) {
      toast.error("Select at least one program.");
      return;
    }

    const excludedLevelSubjects: Record<string, string[]> = {};
    allSelectableSubjects
      .filter((key) => !selectedSubjects.has(key))
      .forEach((key) => {
        const { groupName, subjectName } = parseSubjectKey(key);
        if (!groupName) return;
        if (!excludedLevelSubjects[groupName]) excludedLevelSubjects[groupName] = [];
        excludedLevelSubjects[groupName].push(subjectName);
      });

    const levelConfigsPayload = Object.fromEntries(
      Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((p) => {
          const entries: [string, string[]][] = [];
          if (levelConfigs[p]?.names) entries.push([p, levelConfigs[p]!.names]);
          if (p === "college") {
            Array.from(selectedCourses).forEach((code) => {
              if (levelConfigs[code]?.names) entries.push([code, levelConfigs[code]!.names]);
            });
          }
          if (p === "shs") {
            Array.from(selectedStrands).forEach((name) => {
              if (levelConfigs[name]?.names) entries.push([name, levelConfigs[name]!.names]);
            });
          }
          return entries;
        }),
    );

    const sectionConfigsPayload = buildSectionConfigsPayload();

    const gradingScales = seedGradingScale
      ? Object.fromEntries(
          Object.entries(resolvedGradingScales).map(([prog, preset]) => [
            prog,
            { presetKey: preset.key, name: preset.name, ranges: preset.ranges },
          ]),
        )
      : undefined;

    seedMutation.mutate({
      schoolYearId: selectedSchoolYearId,
      programs: Array.from(selectedPrograms),
      courses: selectedPrograms.has("college") ? Array.from(selectedCourses) : undefined,
      strands: selectedPrograms.has("shs") ? Array.from(selectedStrands) : undefined,
      levelConfigs: Object.keys(levelConfigsPayload).length > 0 ? levelConfigsPayload : undefined,
      sectionConfigs: sectionConfigsPayload,
      excludedLevelSubjects:
        Object.keys(excludedLevelSubjects).length > 0 ? excludedLevelSubjects : undefined,
seedGradingScales: seedGradingScale ? true : false,
seedGradingSchemes: seedGradingSchemes ? Object.values(gradingSchemesByProgram).some(Boolean) : false,
seedSemesterTemplates: seedSemesterTemplates ? Object.values(semesterTemplatesByProgram).some(Boolean) : false,
    });
  }

  // Derived sets for disabled states
  const existingProgramTypes = new Set(existingPrograms.map((p) => p.type));
  const existingCourseCodes = new Set(
    existingCourses.map((c) => c.code?.trim()).filter((c): c is string => !!c),
  );
  const existingStrandNames = new Set(existingStrands.map((s) => s.name));
  const existingLevelNames = new Set(existingLevels.map((l) => l.name));
  const existingSubjectTitles = new Set(existingSubjects.map((s) => s.title));

  // Toggle helpers
  const helpers = {
    toggleProgram: (key: string) => seedState.toggleSet(selectedPrograms, key, setSelectedPrograms),
    selectAllPrograms: () => seedState.selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms),
    deselectAllPrograms: () => seedState.deselectAll(setSelectedPrograms),
    toggleStrand: (s: string) => seedState.toggleSet(selectedStrands, s, setSelectedStrands),
    selectAllStrands: () => seedState.selectAll(SHS_STRANDS, setSelectedStrands),
    deselectAllStrands: () => seedState.deselectAll(setSelectedStrands),
    toggleCourse: (c: string) => seedState.toggleSet(selectedCourses, c, setSelectedCourses),
    selectAllCourses: () => seedState.selectAll(COLLEGE_COURSES.map((c) => c.code ?? ""), setSelectedCourses),
    deselectAllCourses: () => seedState.deselectAll(setSelectedCourses),
    toggleSubject: (key: string) => seedState.toggleSet(selectedSubjects, key, setSelectedSubjects),
    selectAllForGroup: (keys: string[]) => {
      const n = new Set(selectedSubjects);
      keys.forEach((k) => n.add(k));
      setSelectedSubjects(n);
    },
    deselectAllForGroup: (keys: string[]) => {
      const n = new Set(selectedSubjects);
      keys.forEach((k) => n.delete(k));
      setSelectedSubjects(n);
    },
  };

  // Summary counts
  const sectionConfigsPayload = buildSectionConfigsPayload();
  const totalLevelCount = Array.from(selectedPrograms)
    .filter((p) => LEVEL_DEFS[p])
    .reduce((sum, p) => sum + (levelConfigs[p]?.count ?? LEVEL_DEFS[p].length), 0);
  const totalSectionCount = Object.values(sectionConfigsPayload).reduce(
    (sum, sections) => sum + sections.length, 0,
  );
  const selectedGradingSchemes = Array.from(selectedPrograms).filter(
    (p) => gradingSchemesByProgram[p] !== false,
  ).length;
  const selectedSemesterTemplates = Array.from(selectedPrograms).filter(
    (p) => semesterTemplatesByProgram[p] !== false,
  ).length;

  const summaryText = !selectedSchoolYearId
    ? "Select a school year to begin."
    : selectedPrograms.size === 0
      ? "Select at least one program."
      : [
          `${selectedPrograms.size} program(s)`,
          totalLevelCount > 0 && `${totalLevelCount} level(s)`,
          totalSectionCount > 0 && `${totalSectionCount} section(s)`,
          selectedPrograms.has("college") && `${Array.from(selectedCourses).length} course(s)`,
          selectedPrograms.has("shs") && `${Array.from(selectedStrands).length} strand(s)`,
          `${allSelectableSubjects.filter((k) => selectedSubjects.has(k)).length} subject(s)`,
          seedGradingScale && `${Object.keys(resolvedGradingScales).length} grading scale(s)`,
          seedState.seedGradingSchemes && `${selectedGradingSchemes} grading scheme(s)`,
          seedState.seedSemesterTemplates && `${selectedSemesterTemplates} semester template(s)`,
        ]
          .filter(Boolean)
          .join(" · ");

  const derivedSelectedLevels = new Set(
    Array.from(selectedPrograms)
      .filter((p) => LEVEL_DEFS[p])
      .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p]),
  );

  return {
    // School year
    schoolYears,
    syLoading,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    handleCreateSchoolYear,
    handleConfirmShortDuration,
    pendingSchoolYear,
    setPendingSchoolYear,
    createSchoolYearMutation,

    // Seed
    seedMutation,
    handleSeed,

    // UI state
    collapsed,
    setCollapsed,
    summaryText,
    derivedSelectedLevels,

    // Existing data (disabled sets)
    existingProgramTypes,
    existingCourseCodes,
    existingStrandNames,
    existingLevelNames,
    existingSubjectTitles,

    // Helpers
    helpers,

    // Pass-through seed state
    ...seedState,
  };
}

// frontend/src/components/admin/data-seeder/hooks/useSeederCard.ts
import { useEffect, useMemo, useState } from "react";
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
import type { EffectiveSeedOverrides } from "./useEffectiveSeedData";
import type { SchoolProfileDepartment } from "@/types/admin/school-profile.types";
import {
  COLLEGE_COURSES,
  LEVEL_DEFS,
  PROGRAMS,
  SHS_STRANDS,
  SECTION_DEFAULTS,
  parseSubjectKey,
} from "../constants/seed-data";
import { useGradingScales } from "@/hooks/admin/useGradingScales";
import { useGradingSchemeTemplates } from "@/hooks/admin/useGradingSchemeTemplates";
import { useSemesterTemplates } from "@/hooks/admin/useSemesterTemplate";

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

export function useSeederCard(overrides?: EffectiveSeedOverrides) {
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

  const selectedSchoolYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);

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

  // Org-scoped (not tied to a specific school year), so no school-year gate.
  const { data: existingGradingScalesList = [] } = useGradingScales();
  const { data: existingGradingSchemeTemplatesList = [] } = useGradingSchemeTemplates();
  const { data: existingSemesterTemplatesList = [] } = useSemesterTemplates();

  const seedState = useSeedState(overrides);

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
    setSeedGradingScale,
    gradingScaleByProgram,
    setGradingScaleForProgram,
    seedGradingSchemes,
    setSeedGradingSchemes,
    gradingSchemesByProgram,
    toggleGradingScheme,
    seedSemesterTemplates,
    setSeedSemesterTemplates,
    semesterTemplatesByProgram,
    toggleSemesterTemplate,
    sectionConfigs,
    seedProgramCalendars,
    setSeedProgramCalendars,
    programCalendarConfigs,
    initProgramCalendar,
    updateProgramCalendar,
    resetAll,
    selectedLevelKeys,
    selectedSectionKeys,
    toLevelKey,
    toSectionKey,
    toggleLevelKey,
    toggleSectionKey,
  } = seedState as typeof seedState & {
    selectedLevelKeys: Set<string>
    selectedSectionKeys: Set<string>
    toLevelKey: (entityKey: string, levelName: string) => string
    toSectionKey: (levelKey: string, sectionName: string) => string
    toggleLevelKey: (key: string) => void
    toggleSectionKey: (key: string) => void
  }

  function buildSectionConfigsPayload(): Record<string, { name: string; capacity: number }[]> {
    const payload: Record<string, { name: string; capacity: number }[]> = {};

    const effectiveHasLevels = (prog: string) =>
      !!(overrides?.levelDefsByEntity?.[prog] ?? LEVEL_DEFS[prog])
    const effectiveLevels = (prog: string): string[] =>
      overrides?.levelDefsByEntity?.[prog] ?? LEVEL_DEFS[prog] ?? []
    const effectiveSection = (levelName: string) =>
      sectionConfigs[levelName]
        ?? overrides?.sectionsByLevelName?.[levelName]
        ?? SECTION_DEFAULTS
    const isLevelSelected = (entityKey: string, levelName: string): boolean => {
      if (selectedLevelKeys.size === 0) return true
      return selectedLevelKeys.has(toLevelKey(entityKey, levelName))
    }
    const filterSections = (levelKey: string, sections: { name: string; capacity: number }[]): { name: string; capacity: number }[] => {
      if (selectedSectionKeys.size === 0) return sections
      return sections.filter((s) => selectedSectionKeys.has(toSectionKey(levelKey, s.name)))
    }

    for (const prog of selectedPrograms) {
      if (!effectiveHasLevels(prog)) continue;
      const levelNames = levelConfigs[prog]?.names ?? effectiveLevels(prog);

      if (prog === "college") {
        for (const course of selectedCourses) {
          for (const levelName of levelNames) {
            if (!isLevelSelected(course, levelName)) continue
            const levelKey = toLevelKey(course, levelName)
            payload[`${course}|${levelName}`] = filterSections(levelKey, effectiveSection(levelName));
          }
        }
      } else if (prog === "shs") {
        for (const strand of selectedStrands) {
          for (const levelName of levelNames) {
            if (!isLevelSelected(strand, levelName)) continue
            const levelKey = toLevelKey(strand, levelName)
            payload[`${strand}|${levelName}`] = filterSections(levelKey, effectiveSection(levelName));
          }
        }
      } else {
        for (const levelName of levelNames) {
          if (!isLevelSelected(prog, levelName)) continue
          const levelKey = toLevelKey(prog, levelName)
          payload[levelName] = filterSections(levelKey, effectiveSection(levelName));
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
      queryKeys.admin.gradingScales.list(),
      queryKeys.admin.gradingSchemeTemplates.all,
      queryKeys.admin.semesterTemplates.all,
    ],
      onSuccess: (result) => {
        const warnings: string[] = result?.result?.warnings ?? [];
        if (warnings.length > 0) {
          warnings.slice(0, 3).forEach((w) => toast.warning(w));
          toast.success("Seed completed with some notices (see above).");
        } else {
          toast.success("Seed completed! Your departments, levels, and subjects are ready.");
        }
        setCollapsed(true);
        resetAll();
      },
      onError: (err: unknown) => {
  const message =
    isAxiosError<{ message?: string }>(err) && err.response?.data?.message
      ? err.response.data.message
      : "Seed failed. Please try again.";
  toast.error(message);
},
    }
  );

  function handleSeed() {
    if (!selectedSchoolYearId) {
      toast.error("Select or create a school year first.");
      return;
    }
    if (selectedPrograms.size === 0) {
      toast.error("Select at least one department.");
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

    const effectiveHasLevels = (p: string) =>
      !!(overrides?.levelDefsByEntity?.[p] ?? LEVEL_DEFS[p])
    const levelConfigsPayload = (() => {
      if (selectedLevelKeys.size > 0) {
        const byEntity = new Map<string, string[]>()
        for (const key of selectedLevelKeys) {
          const sep = key.indexOf("::")
          if (sep === -1) continue
          const entity = key.slice(0, sep)
          const lvl = key.slice(sep + 2)
          const isCourse = selectedCourses.has(entity)
          const isStrand = selectedStrands.has(entity)
          const isProg = selectedPrograms.has(entity)
          if (isCourse && selectedPrograms.has("college")) {
            if (!byEntity.has(entity)) byEntity.set(entity, [])
            byEntity.get(entity)!.push(lvl)
          } else if (isStrand && selectedPrograms.has("shs")) {
            if (!byEntity.has(entity)) byEntity.set(entity, [])
            byEntity.get(entity)!.push(lvl)
          } else if (isProg) {
            if (!byEntity.has(entity)) byEntity.set(entity, [])
            byEntity.get(entity)!.push(lvl)
          }
        }
        if (byEntity.size > 0) return Object.fromEntries(byEntity)
      }
      return Object.fromEntries(
        Array.from(selectedPrograms)
          .filter((p) => effectiveHasLevels(p))
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
      )
    })()

    const sectionConfigsPayload = buildSectionConfigsPayload();

    const gradingScales = seedGradingScale
      ? Object.fromEntries(
          Object.entries(resolvedGradingScales).map(([prog, preset]) => [
            prog,
            { presetKey: preset.key, name: preset.name, ranges: preset.ranges },
          ]),
        )
      : undefined;

    const programCalendars =
      seedProgramCalendars
        ? Object.fromEntries(
            Array.from(selectedPrograms)
              .filter(
                (p) => !!programCalendarConfigs[p]?.startDate && !!programCalendarConfigs[p]?.endDate,
              )
              .map((p) => [
                p,
                {
                  startDate: programCalendarConfigs[p].startDate,
                  endDate: programCalendarConfigs[p].endDate,
                  notes: programCalendarConfigs[p].notes?.trim() || undefined,
                  breaks: programCalendarConfigs[p].breaks
                    .filter((b) => b.startDate && b.endDate)
                    .map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
                },
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
  gradingScales,
  seedGradingScales: seedGradingScale ? true : false,
  seedGradingSchemes: seedGradingSchemes ? Object.values(gradingSchemesByProgram).some(Boolean) : false,
  seedSemesterTemplates: seedSemesterTemplates ? Object.values(semesterTemplatesByProgram).some(Boolean) : false,
  seedProgramCalendars: !!programCalendars && Object.keys(programCalendars).length > 0,
  programCalendars,
});
  }

  function handleSelectAll(allowedProgramTypes?: Set<string> | null) {
    if (!selectedSchoolYearId) {
      toast.error("Select a school year first.");
      return;
    }
    const targets = allowedProgramTypes ? Array.from(allowedProgramTypes) : PROGRAMS.map((p) => p.key)
    // Select all departments (filtered by configured when preset exists)
    seedState.selectAll(targets, setSelectedPrograms)
    // Select all courses/strands when applicable (respects overrides)
    if (targets.includes("college")) {
      const courseCodes = overrides?.collegeCourses?.map((c) => c.code) ?? COLLEGE_COURSES.map((c) => c.code ?? "")
      seedState.selectAll(courseCodes, setSelectedCourses)
    }
    if (targets.includes("shs")) {
      const strands = overrides?.shsStrands ?? SHS_STRANDS
      seedState.selectAll(strands, setSelectedStrands)
    }
    // Enable grading scales/schemes (one per department) — semester templates excluded (needs calendar)
    setSeedGradingScale(true)
    // auto-select per-program via toggle handlers (sets all to true)
    setSeedGradingSchemes(true)
    setSeedProgramCalendars(true)
    toast.success("Selected all configured departments and templates (semester templates excluded — configure calendar first).")
  }

  // Derived sets for disabled states
  const existingProgramTypes = new Set(existingPrograms.map((p) => p.type));
  const existingCourseCodes = new Set(
    existingCourses.map((c) => c.code?.trim()).filter((c): c is string => !!c),
  );
  const existingStrandNames = new Set(existingStrands.map((s) => s.name));
  const existingLevelNames = new Set(existingLevels.map((l) => l.name));
  const existingSubjectTitles = new Set(existingSubjects.map((s) => s.title));
  const existingGradingScaleNames = new Set(existingGradingScalesList.map((s) => s.name));
  const existingGradingSchemeNames = new Set(existingGradingSchemeTemplatesList.map((t) => t.name));
  const existingSemesterTemplateNames = new Set(existingSemesterTemplatesList.map((t) => t.name));

  // Toggle helpers — select-all respects school-profile overrides when present
  const effectiveStrands = overrides?.shsStrands ?? SHS_STRANDS
  const effectiveCourseCodes = overrides?.collegeCourses?.map((c) => c.code) ?? COLLEGE_COURSES.map((c) => c.code ?? "")
  const helpers = {
    toggleProgram: (key: string) => seedState.toggleSet(selectedPrograms, key, setSelectedPrograms),
    selectAllPrograms: () => seedState.selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms),
    deselectAllPrograms: () => seedState.deselectAll(setSelectedPrograms),
    toggleStrand: (s: string) => seedState.toggleSet(selectedStrands, s, setSelectedStrands),
    selectAllStrands: () => seedState.selectAll(effectiveStrands, setSelectedStrands),
    deselectAllStrands: () => seedState.deselectAll(setSelectedStrands),
    toggleCourse: (c: string) => seedState.toggleSet(selectedCourses, c, setSelectedCourses),
    selectAllCourses: () => seedState.selectAll(effectiveCourseCodes, setSelectedCourses),
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
  const effectiveLevelsForCount = (p: string): string[] =>
    overrides?.levelDefsByEntity?.[p] ?? LEVEL_DEFS[p] ?? []
  const effectiveHasLevelsForCount = (p: string) =>
    !!(overrides?.levelDefsByEntity?.[p] ?? LEVEL_DEFS[p])
  const totalLevelCount = selectedLevelKeys.size > 0
    ? Array.from(selectedLevelKeys).filter((k) => {
        const entity = k.split("::")[0]
        return selectedPrograms.has(entity) || selectedCourses.has(entity) || selectedStrands.has(entity)
      }).length
    : Array.from(selectedPrograms)
        .filter((p) => effectiveHasLevelsForCount(p))
        .reduce((sum, p) => sum + (levelConfigs[p]?.count ?? effectiveLevelsForCount(p).length), 0);
  const totalSectionCount = Object.values(sectionConfigsPayload).reduce(
    (sum, sections) => sum + sections.length, 0,
  );
  const selectedGradingSchemes = Array.from(selectedPrograms).filter(
    (p) => gradingSchemesByProgram[p] !== false,
  ).length;
  const selectedSemesterTemplates = Array.from(selectedPrograms).filter(
    (p) => semesterTemplatesByProgram[p] !== false,
  ).length;
  const selectedProgramCalendars = seedProgramCalendars
    ? Array.from(selectedPrograms).filter(
        (p) => !!programCalendarConfigs[p]?.startDate && !!programCalendarConfigs[p]?.endDate,
      ).length
    : 0;

  const summaryText = !selectedSchoolYearId
    ? "Select a school year to begin."
    : selectedPrograms.size === 0
      ? "Select at least one department."
      : [
          `${selectedPrograms.size} department(s)`,
          totalLevelCount > 0 && `${totalLevelCount} level(s)`,
          totalSectionCount > 0 && `${totalSectionCount} section(s)`,
          selectedPrograms.has("college") && `${Array.from(selectedCourses).length} course(s)`,
          selectedPrograms.has("shs") && `${Array.from(selectedStrands).length} strand(s)`,
          `${allSelectableSubjects.filter((k) => selectedSubjects.has(k)).length} subject(s)`,
          seedGradingScale && `${Object.keys(resolvedGradingScales).length} grading scale(s)`,
          seedState.seedGradingSchemes && `${selectedGradingSchemes} grading scheme(s)`,
          seedState.seedSemesterTemplates && `${selectedSemesterTemplates} semester template(s)`,
          seedProgramCalendars && `${selectedProgramCalendars} department calendar(s)`,
        ]
          .filter(Boolean)
          .join(" · ");

  const summaryItems: { label: string; value: number }[] = [
    { label: "Departments", value: selectedPrograms.size },
    ...(totalLevelCount > 0 ? [{ label: "Levels", value: totalLevelCount }] : []),
    ...(totalSectionCount > 0 ? [{ label: "Sections", value: totalSectionCount }] : []),
    ...(selectedPrograms.has("college")
      ? [{ label: "Courses", value: selectedCourses.size }]
      : []),
    ...(selectedPrograms.has("shs") ? [{ label: "Strands", value: selectedStrands.size }] : []),
    {
      label: "Subjects",
      value: allSelectableSubjects.filter((k) => selectedSubjects.has(k)).length,
    },
    ...(seedGradingScale && Object.keys(resolvedGradingScales).length > 0
      ? [{ label: "Grading Scales", value: Object.keys(resolvedGradingScales).length }]
      : []),
    ...(seedState.seedGradingSchemes && selectedGradingSchemes > 0
      ? [{ label: "Grading Schemes", value: selectedGradingSchemes }]
      : []),
    ...(seedState.seedSemesterTemplates && selectedSemesterTemplates > 0
      ? [{ label: "Semester Templates", value: selectedSemesterTemplates }]
      : []),
    ...(seedProgramCalendars && selectedProgramCalendars > 0
      ? [{ label: "Department Calendars", value: selectedProgramCalendars }]
      : []),
  ];

  const derivedSelectedLevels = useMemo(() => {
    if (selectedLevelKeys.size > 0) {
      const names = new Set<string>()
      for (const key of selectedLevelKeys) {
        const sep = key.indexOf("::")
        if (sep !== -1) names.add(key.slice(sep + 2))
        else names.add(key)
      }
      return names
    }
    return new Set(
      Array.from(selectedPrograms)
        .filter((p) => !!(overrides?.levelDefsByEntity?.[p] ?? LEVEL_DEFS[p]))
        .flatMap((p) => levelConfigs[p]?.names ?? overrides?.levelDefsByEntity?.[p] ?? LEVEL_DEFS[p] ?? []),
    )
  }, [selectedLevelKeys, selectedPrograms, levelConfigs, overrides])

  return {
    // School year
    schoolYears,
    syLoading,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    selectedSchoolYear,
    handleCreateSchoolYear,
    handleConfirmShortDuration,
    pendingSchoolYear,
    setPendingSchoolYear,
    createSchoolYearMutation,

    // Seed
    seedMutation,
    handleSeed,
    handleSelectAll,

    // UI state
    collapsed,
    setCollapsed,
    summaryText,
    summaryItems,
    derivedSelectedLevels,

    // Existing data (disabled sets)
    existingProgramTypes,
    existingCourseCodes,
    existingStrandNames,
    existingLevelNames,
    existingSubjectTitles,
    existingGradingScaleNames,
    existingGradingSchemeNames,
    existingSemesterTemplateNames,

    // Helpers
    helpers,

    // Pass-through seed state
    ...seedState,
  };
}
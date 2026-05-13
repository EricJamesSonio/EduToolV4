import { useEffect, useMemo, useState } from "react";
import {
  seedCourses,
  generateSeedLevelNames,
  seedGradingSchemes,
  seedGradingScales,
  seedLevelDefaults,
  seedLevels,
  seedPayloadFeatureLabels,
  seedPrograms,
  seedSemesterTemplates,
  seedSubjectCatalog,
  seedStrands,
} from "@/constants/orgSeedPresets";
import { useCreateSchoolYear } from "../../academic/hooks/useSchoolYearMutations";
import { useSchoolYears } from "../../academic/hooks/useSchoolYears";
import { useSystemSeedExistingData } from "../hooks/useSystemSeedExistingData";
import type {
  CreateSchoolYearDto,
  SchoolYear,
} from "../../academic/types/school-year.types";
import type {
  SeedOrganizationDto,
  SeedOrganizationResponse,
} from "../types/organization.types";

interface AdminDataSeederPageProps {
  isSeeding: boolean;
  seedResult: SeedOrganizationResponse | null;
  onBack: () => void;
  onSeed: (data: SeedOrganizationDto) => void;
}

type SeederSection =
  | "programs"
  | "courses"
  | "strands"
  | "levels"
  | "subjects"
  | "grading"
  | "schemes"
  | "templates";

const uniqueLevelNames = Array.from(
  new Set(seedLevels.map((level) => level.name)),
);
const defaultLevelCounts = Object.fromEntries(
  Object.entries(seedLevelDefaults).map(([programKey, config]) => [
    programKey,
    config.defaultCount,
  ]),
);
const programKeyByName = Object.fromEntries(
  seedPrograms.map((program) => [program.name, program.key]),
);
const programNameByKey = Object.fromEntries(
  seedPrograms.map((program) => [program.key, program.name]),
);

const AdminDataSeederPage: React.FC<AdminDataSeederPageProps> = ({
  isSeeding,
  seedResult,
  onBack,
  onSeed,
}) => {
  const [schoolYearId, setSchoolYearId] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedStrands, setSelectedStrands] = useState<string[]>([]);
  const [levelCounts, setLevelCounts] =
    useState<Record<string, number>>(defaultLevelCounts);
  const [excludedSubjectKeys, setExcludedSubjectKeys] = useState<string[]>([]);
  const [excludedScaleKeys, setExcludedScaleKeys] = useState<string[]>([]);
  const [excludedSchemeKeys, setExcludedSchemeKeys] = useState<string[]>([]);
  const [excludedSemesterTemplateKeys, setExcludedSemesterTemplateKeys] =
    useState<string[]>([]);
  const [includeGradingScales, setIncludeGradingScales] = useState(true);
  const [openSections, setOpenSections] = useState<SeederSection[]>([
    "programs",
  ]);
  const [showCreateSchoolYear, setShowCreateSchoolYear] = useState(false);
  const [newSchoolYearName, setNewSchoolYearName] = useState("");
  const [newSchoolYearStartDate, setNewSchoolYearStartDate] = useState("");
  const [newSchoolYearEndDate, setNewSchoolYearEndDate] = useState("");
  const [schoolYearErrors, setSchoolYearErrors] = useState<{
    name?: string;
    startDate?: string;
    endDate?: string;
  }>({});

  const { data: schoolYears = [] } = useSchoolYears();
  const createSchoolYearMutation = useCreateSchoolYear();
  const existingDataQuery = useSystemSeedExistingData(schoolYearId);

  const selectedSchoolYear = useMemo(
    () =>
      schoolYears.find((schoolYear) => schoolYear.id === schoolYearId) ?? null,
    [schoolYearId, schoolYears],
  );

  useEffect(() => {
    if (schoolYearId || schoolYears.length === 0) return;
    const activeSchoolYear = schoolYears.find(
      (schoolYear) => schoolYear.status === "active",
    );
    if (activeSchoolYear) setSchoolYearId(activeSchoolYear.id);
  }, [schoolYearId, schoolYears]);

  const existingData = existingDataQuery.data;
  const existingProgramsByKey = useMemo(() => {
    const map = new Map<string, string>();
    existingData?.programs.forEach((program) => {
      const key = programKeyByName[program.name] ?? program.type;
      map.set(key, program.id);
    });
    return map;
  }, [existingData?.programs]);

  const existingCourseCodes = useMemo(() => {
    return new Set(
      existingData?.programs.flatMap((program) =>
        (program.courses ?? []).map((course) => course.code),
      ) ?? [],
    );
  }, [existingData?.programs]);

  const existingStrandNames = useMemo(() => {
    return new Set(
      existingData?.programs.flatMap((program) =>
        (program.strands ?? []).map((strand) => strand.name),
      ) ?? [],
    );
  }, [existingData?.programs]);

  const existingLevelNames = useMemo(() => {
    return new Set((existingData?.levels ?? []).map((level) => level.name));
  }, [existingData?.levels]);

  const existingGradingScaleKeys = useMemo(() => {
    const keys = new Set<string>();
    existingData?.gradingScales.forEach((scale) => {
      const program = existingData.programs.find(
        (item) => item.id === (scale.program_id ?? scale.programId),
      );
      const programKey = program
        ? (programKeyByName[program.name] ?? program.type)
        : null;
      if (programKey) keys.add(`${programKey}:${scale.name}`);
    });
    return keys;
  }, [existingData]);

  const existingSchemeNames = useMemo(() => {
    return new Set(
      (existingData?.gradingSchemeTemplates ?? []).map(
        (template) => template.name,
      ),
    );
  }, [existingData?.gradingSchemeTemplates]);

  const existingSemesterTemplateNames = useMemo(() => {
    return new Set(
      (existingData?.semesterTemplates ?? []).map((template) => template.name),
    );
  }, [existingData?.semesterTemplates]);

  const existingSemesterProgramIds = useMemo(() => {
    return new Set(
      (existingData?.semesterAssignments ?? []).map(
        (assignment) => assignment.program_id ?? assignment.programId,
      ),
    );
  }, [existingData?.semesterAssignments]);

  const selectedProgramSet = useMemo(
    () => new Set(selectedPrograms),
    [selectedPrograms],
  );

  useEffect(() => {
    if (!existingData) return;

    const reusableProgramKeys = existingData.programs
      .map((program) => programKeyByName[program.name] ?? program.type)
      .filter(
        (programKey): programKey is string =>
          !!programKey && !!seedLevelDefaults[programKey],
      );

    if (reusableProgramKeys.length === 0) return;

    setSelectedPrograms((current) =>
      Array.from(new Set([...current, ...reusableProgramKeys])),
    );
  }, [existingData]);

  const generatedLevelNames = useMemo(() => {
    return selectedPrograms.flatMap((programKey) =>
      generateSeedLevelNames(
        programKey,
        levelCounts[programKey] ??
          seedLevelDefaults[programKey]?.defaultCount ??
          0,
      ),
    );
  }, [levelCounts, selectedPrograms]);
  const subjectGroups = useMemo(() => {
    const groups: Array<{ groupName: string; subjects: string[] }> = [];
    generatedLevelNames.forEach((levelName) => {
      if (seedSubjectCatalog[levelName]) {
        groups.push({
          groupName: levelName,
          subjects: seedSubjectCatalog[levelName],
        });
      }
    });
    if (selectedProgramSet.has("college") && seedSubjectCatalog.college_ge) {
      groups.push({
        groupName: "college_ge",
        subjects: seedSubjectCatalog.college_ge,
      });
    }
    return groups;
  }, [generatedLevelNames, selectedProgramSet]);
  const availableSubjectKeys = useMemo(() => {
    return subjectGroups.flatMap((group) =>
      group.subjects.map((subject) => `${group.groupName}::${subject}`),
    );
  }, [subjectGroups]);
  const selectedCourseCount = selectedCourses.filter(
    (courseCode) => !existingCourseCodes.has(courseCode),
  ).length;
  const selectedStrandCount = selectedStrands.filter(
    (strand) => !existingStrandNames.has(strand),
  ).length;
  const selectedLevelCount = generatedLevelNames.filter(
    (levelName) => !existingLevelNames.has(levelName),
  ).length;
  const selectedScaleCount = includeGradingScales
    ? Object.entries(seedGradingScales).filter(
        ([programKey, scale]) =>
          selectedProgramSet.has(programKey) &&
          !excludedScaleKeys.includes(programKey) &&
          !existingGradingScaleKeys.has(`${programKey}:${scale.name}`),
      ).length
    : 0;
  const selectedSchemeCount = seedGradingSchemes.filter(
    (scheme) =>
      selectedProgramSet.has(scheme.programKey) &&
      !excludedSchemeKeys.includes(scheme.programKey),
  ).length;
  const selectedSemesterTemplateCount = seedSemesterTemplates.filter(
    (template) =>
      selectedProgramSet.has(template.programKey) &&
      !excludedSemesterTemplateKeys.includes(template.programKey),
  ).length;
  const toggleValue = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  const toggleProgram = (programKey: string) => {
    if (existingProgramsByKey.has(programKey)) return;
    toggleValue(programKey, selectedPrograms, setSelectedPrograms);
  };

  const toggleExcludedValue = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  const setProgramLevelCount = (programKey: string, nextCount: number) => {
    const config = seedLevelDefaults[programKey];
    if (!config) return;
    const boundedCount = Math.min(config.max, Math.max(config.min, nextCount));
    setLevelCounts((current) => ({ ...current, [programKey]: boundedCount }));
  };

  useEffect(() => {
    setSelectedCourses((current) =>
      selectedProgramSet.has("college") ? current : [],
    );
    setSelectedStrands((current) =>
      selectedProgramSet.has("shs") ? current : [],
    );
    setExcludedSubjectKeys((current) =>
      current.filter((key) => availableSubjectKeys.includes(key)),
    );
    setExcludedScaleKeys((current) =>
      current.filter((programKey) => selectedProgramSet.has(programKey)),
    );
    setExcludedSchemeKeys((current) =>
      current.filter((programKey) => selectedProgramSet.has(programKey)),
    );
    setExcludedSemesterTemplateKeys((current) =>
      current.filter((programKey) => selectedProgramSet.has(programKey)),
    );
  }, [availableSubjectKeys, selectedProgramSet]);

  const toggleSection = (section: SeederSection) => {
    setOpenSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  };

  const isSectionOpen = (section: SeederSection) =>
    openSections.includes(section);

  const validateSchoolYear = () => {
    const errors: typeof schoolYearErrors = {};
    if (!newSchoolYearName.trim())
      errors.name = "School year name is required.";
    if (!newSchoolYearStartDate) errors.startDate = "Start date is required.";
    if (!newSchoolYearEndDate) errors.endDate = "End date is required.";
    if (
      newSchoolYearStartDate &&
      newSchoolYearEndDate &&
      newSchoolYearEndDate < newSchoolYearStartDate
    ) {
      errors.endDate = "End date must be after the start date.";
    }
    setSchoolYearErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetSchoolYearForm = () => {
    setNewSchoolYearName("");
    setNewSchoolYearStartDate("");
    setNewSchoolYearEndDate("");
    setSchoolYearErrors({});
    setShowCreateSchoolYear(false);
  };

  const handleCreateSchoolYear = async (data: CreateSchoolYearDto) => {
    const result = await createSchoolYearMutation.mutateAsync(data);
    const createdSchoolYear =
      (result as { data?: SchoolYear }).data ??
      (result as unknown as SchoolYear);
    if (!createdSchoolYear?.id) return;
    setSchoolYearId(createdSchoolYear.id);
    resetSchoolYearForm();
  };

  const handleCreateSchoolYearFromForm = async () => {
    if (!validateSchoolYear()) return;
    await handleCreateSchoolYear({
      name: newSchoolYearName.trim(),
      start_date: newSchoolYearStartDate,
      end_date: newSchoolYearEndDate,
    });
  };

  const handleSeed = () => {
    const gradingScales = Object.fromEntries(
      Object.entries(seedGradingScales).filter(
        ([programKey, scale]) =>
          selectedProgramSet.has(programKey) &&
          !excludedScaleKeys.includes(programKey) &&
          !existingGradingScaleKeys.has(`${programKey}:${scale.name}`),
      ),
    );
    const courses = selectedCourses.filter(
      (courseCode) => !existingCourseCodes.has(courseCode),
    );
    const strands = selectedStrands.filter(
      (strand) => !existingStrandNames.has(strand),
    );
    const levelConfigs = Object.fromEntries(
      selectedPrograms.map((programKey) => [
        programKey,
        generateSeedLevelNames(
          programKey,
          levelCounts[programKey] ??
            seedLevelDefaults[programKey]?.defaultCount ??
            0,
        ),
      ]),
    );
    const excludedLevelSubjects = excludedSubjectKeys.reduce<
      Record<string, string[]>
    >((acc, key) => {
      const [groupName, subjectName] = key.split("::");
      if (!groupName || !subjectName) return acc;
      acc[groupName] = [...(acc[groupName] ?? []), subjectName];
      return acc;
    }, {});

    onSeed({
      schoolYearId,
      programs: selectedPrograms,
      courses: selectedProgramSet.has("college") ? courses : undefined,
      strands: selectedProgramSet.has("shs") ? strands : undefined,
      excludedLevels: uniqueLevelNames.filter(
        (levelName) =>
          !generatedLevelNames.includes(levelName) ||
          existingLevelNames.has(levelName),
      ),
      levelConfigs,
      excludedLevelSubjects:
        Object.keys(excludedLevelSubjects).length > 0
          ? excludedLevelSubjects
          : undefined,
      excludedGradingSchemePrograms:
        excludedSchemeKeys.length > 0 ? excludedSchemeKeys : undefined,
      excludedSemesterTemplatePrograms:
        excludedSemesterTemplateKeys.length > 0
          ? excludedSemesterTemplateKeys
          : undefined,
      gradingScales:
        includeGradingScales && Object.keys(gradingScales).length > 0
          ? gradingScales
          : undefined,
    });
  };

  const summaryItems = [
    `${selectedPrograms.length} programs`,
    selectedProgramSet.has("college") ? `${selectedCourseCount} courses` : null,
    selectedProgramSet.has("shs") ? `${selectedStrandCount} strands` : null,
    selectedPrograms.length > 0 ? `${selectedLevelCount} levels` : null,
    selectedPrograms.length > 0
      ? `${availableSubjectKeys.length - excludedSubjectKeys.length} subjects`
      : null,
    `${selectedScaleCount} grading scales`,
    selectedPrograms.length > 0
      ? `${selectedSchemeCount} grading schemes`
      : null,
    selectedPrograms.length > 0
      ? `${selectedSemesterTemplateCount} semester templates`
      : null,
  ].filter(Boolean);

  return (
    <div className="system-detail-page">
      <div className="view-container">
        <div className="view-header">
          <button type="button" onClick={onBack} className="back-button">
            Back to System
          </button>

          <div className="header-title">
            <h2 className="dashboard-section-title">Data Seeder</h2>
            <p className="dashboard-section-subtitle">
              Seed academic setup presets for a selected school year.
            </p>
          </div>
        </div>
      </div>

      <div className="system-seeder-workspace">
        <section className="system-seeder-panel">
          <div className="system-seeder-header">
            <div>
              <h3 className="card-title">School Year</h3>
              <p className="system-section-copy">
                Select the school year where seed data should be created.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateSchoolYear((current) => !current)}
            >
              {showCreateSchoolYear ? "Cancel" : "Create School Year"}
            </button>
          </div>

          {schoolYears.length > 0 ? (
            <div className="system-school-year-grid">
              {schoolYears.map((schoolYear) => (
                <button
                  key={schoolYear.id}
                  type="button"
                  className={`system-school-year-option ${schoolYearId === schoolYear.id ? "is-selected" : ""}`}
                  onClick={() => setSchoolYearId(schoolYear.id)}
                >
                  <span>
                    <strong>{schoolYear.name}</strong>
                    {(schoolYear.start_date || schoolYear.end_date) && (
                      <small>
                        {schoolYear.start_date
                          ? new Date(schoolYear.start_date).toLocaleDateString()
                          : "-"}
                        {" - "}
                        {schoolYear.end_date
                          ? new Date(schoolYear.end_date).toLocaleDateString()
                          : "-"}
                      </small>
                    )}
                  </span>
                  <em>{schoolYear.status}</em>
                </button>
              ))}
            </div>
          ) : (
            <p className="system-section-note">
              No school years found. Create one below to proceed.
            </p>
          )}

          {showCreateSchoolYear && (
            <div className="system-create-school-year">
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="seed-new-school-year-name"
                >
                  School Year Name
                </label>
                <input
                  id="seed-new-school-year-name"
                  className="form-input"
                  value={newSchoolYearName}
                  onChange={(event) => setNewSchoolYearName(event.target.value)}
                  placeholder="S.Y. 2026-2027"
                />
                {schoolYearErrors.name && (
                  <span className="form-error">{schoolYearErrors.name}</span>
                )}
              </div>

              <div className="system-create-school-year-dates">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="seed-new-school-year-start"
                  >
                    Start Date
                  </label>
                  <input
                    id="seed-new-school-year-start"
                    className="form-input"
                    type="date"
                    value={newSchoolYearStartDate}
                    onChange={(event) =>
                      setNewSchoolYearStartDate(event.target.value)
                    }
                  />
                  {schoolYearErrors.startDate && (
                    <span className="form-error">
                      {schoolYearErrors.startDate}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="seed-new-school-year-end"
                  >
                    End Date
                  </label>
                  <input
                    id="seed-new-school-year-end"
                    className="form-input"
                    type="date"
                    value={newSchoolYearEndDate}
                    onChange={(event) =>
                      setNewSchoolYearEndDate(event.target.value)
                    }
                  />
                  {schoolYearErrors.endDate && (
                    <span className="form-error">
                      {schoolYearErrors.endDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="system-inline-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCreateSchoolYearFromForm}
                  disabled={createSchoolYearMutation.isPending}
                >
                  {createSchoolYearMutation.isPending
                    ? "Creating..."
                    : "Create and Select"}
                </button>
              </div>
            </div>
          )}
        </section>

        {selectedSchoolYear && (
          <>
            <section className="system-seeder-summary">
              <div>
                <h3>Seed Plan</h3>
                <p>
                  Existing records are locked or skipped. Review the sections
                  below, then apply the selected seed plan.
                </p>
              </div>
              <div className="system-summary-chips">
                {summaryItems.map((item) => (
                  <span key={item} className="system-chip">
                    {item}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary system-seed-submit"
                disabled={
                  isSeeding || !schoolYearId || selectedPrograms.length === 0
                }
                onClick={handleSeed}
              >
                {isSeeding ? "Seeding..." : "Apply Seed"}
              </button>
            </section>

            <section className="system-seeder-panel">
              <h3 className="card-title">What This Seeds</h3>
              <p className="system-section-copy">
                The seeder creates academic structure for{" "}
                {selectedSchoolYear.name}.
              </p>
              <div className="system-chip-list">
                {seedPayloadFeatureLabels.map((label) => (
                  <span key={label} className="system-chip">
                    {label}
                  </span>
                ))}
              </div>
            </section>

            {existingDataQuery.isFetching && (
              <div className="system-inline-loading">
                <div className="loading-spinner"></div>
                <span className="loading-text">
                  Checking existing seeded data...
                </span>
              </div>
            )}

            <section className="system-seeder-accordion">
              <button
                type="button"
                className="system-seeder-accordion-header"
                onClick={() => toggleSection("programs")}
              >
                <span>Programs</span>
                <strong>
                  {selectedPrograms.length}/{seedPrograms.length} selected
                </strong>
              </button>
              {isSectionOpen("programs") && (
                <div className="system-seeder-accordion-body">
                  <p className="system-section-copy">
                    Programs are the top-level structure. Existing programs stay
                    selected because child data depends on them.
                  </p>
                  <div className="system-option-grid">
                    {seedPrograms.map((program) => (
                      <button
                        key={program.key}
                        type="button"
                        className={`system-option-tile ${selectedPrograms.includes(program.key) ? "is-selected" : ""}`}
                        disabled={existingProgramsByKey.has(program.key)}
                        onClick={() => toggleProgram(program.key)}
                      >
                        <span>
                          <strong>{program.name}</strong>
                          {existingProgramsByKey.has(program.key) && (
                            <small>Already exists, reused</small>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {selectedProgramSet.has("college") && (
              <section className="system-seeder-accordion">
                <button
                  type="button"
                  className="system-seeder-accordion-header"
                  onClick={() => toggleSection("courses")}
                >
                  <span>Courses</span>
                  <strong>
                    {selectedCourseCount}/{seedCourses.length} selected
                  </strong>
                </button>
                {isSectionOpen("courses") && (
                  <div className="system-seeder-accordion-body">
                    <div className="system-option-grid system-option-grid-compact">
                      {seedCourses.map((course) => (
                        <button
                          key={course.code}
                          type="button"
                          className={`system-option-tile ${selectedCourses.includes(course.code) ? "is-selected" : ""}`}
                          disabled={existingCourseCodes.has(course.code)}
                          onClick={() =>
                            toggleValue(
                              course.code,
                              selectedCourses,
                              setSelectedCourses,
                            )
                          }
                        >
                          <span>
                            <strong>{course.code}</strong>
                            <small>{course.name}</small>
                            {existingCourseCodes.has(course.code) && (
                              <small>Already seeded</small>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {selectedProgramSet.has("shs") && (
              <section className="system-seeder-accordion">
                <button
                  type="button"
                  className="system-seeder-accordion-header"
                  onClick={() => toggleSection("strands")}
                >
                  <span>Strands</span>
                  <strong>
                    {selectedStrandCount}/{seedStrands.length} selected
                  </strong>
                </button>
                {isSectionOpen("strands") && (
                  <div className="system-seeder-accordion-body">
                    <div className="system-option-grid system-option-grid-compact">
                      {seedStrands.map((strand) => (
                        <button
                          key={strand}
                          type="button"
                          className={`system-option-tile ${selectedStrands.includes(strand) ? "is-selected" : ""}`}
                          disabled={existingStrandNames.has(strand)}
                          onClick={() =>
                            toggleValue(
                              strand,
                              selectedStrands,
                              setSelectedStrands,
                            )
                          }
                        >
                          <span>
                            <strong>{strand}</strong>
                            {existingStrandNames.has(strand) && (
                              <small>Already seeded</small>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {selectedPrograms.length > 0 && (
              <>
                <section className="system-seeder-accordion">
                  <button
                    type="button"
                    className="system-seeder-accordion-header"
                    onClick={() => toggleSection("levels")}
                  >
                    <span>Levels</span>
                    <strong>{selectedLevelCount} generated</strong>
                  </button>
                  {isSectionOpen("levels") && (
                    <div className="system-seeder-accordion-body">
                      <p className="system-section-copy">
                        Set how many continuous levels to generate per selected
                        program. This prevents gaps like creating Level 2
                        without Level 1.
                      </p>
                      <div className="system-level-count-grid">
                        {selectedPrograms.map((programKey) => {
                          const config = seedLevelDefaults[programKey];
                          if (!config) return null;
                          const names = generateSeedLevelNames(
                            programKey,
                            levelCounts[programKey] ?? config.defaultCount,
                          );
                          return (
                            <div
                              key={programKey}
                              className="system-level-count-card"
                            >
                              <div>
                                <strong>{config.label}</strong>
                                <span>{programNameByKey[programKey]}</span>
                              </div>
                              <div className="system-stepper">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProgramLevelCount(
                                      programKey,
                                      (levelCounts[programKey] ??
                                        config.defaultCount) - 1,
                                    )
                                  }
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={config.min}
                                  max={config.max}
                                  value={
                                    levelCounts[programKey] ??
                                    config.defaultCount
                                  }
                                  onChange={(event) =>
                                    setProgramLevelCount(
                                      programKey,
                                      Number(event.target.value),
                                    )
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProgramLevelCount(
                                      programKey,
                                      (levelCounts[programKey] ??
                                        config.defaultCount) + 1,
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                              <small>{names.join(", ")}</small>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="system-seeder-accordion">
                  <button
                    type="button"
                    className="system-seeder-accordion-header"
                    onClick={() => toggleSection("subjects")}
                  >
                    <span>Subjects</span>
                    <strong>
                      {availableSubjectKeys.length - excludedSubjectKeys.length}
                      /{availableSubjectKeys.length} included
                    </strong>
                  </button>
                  {isSectionOpen("subjects") && (
                    <div className="system-seeder-accordion-body">
                      <p className="system-section-copy">
                        Subjects are included by default. Uncheck subjects your
                        school does not offer.
                      </p>
                      <div className="system-subject-group-list">
                        {subjectGroups.map((group) => (
                          <div
                            key={group.groupName}
                            className="system-subject-group"
                          >
                            <div className="system-subject-group-header">
                              <strong>{group.groupName}</strong>
                              <span>
                                {
                                  group.subjects.filter(
                                    (subject) =>
                                      !excludedSubjectKeys.includes(
                                        `${group.groupName}::${subject}`,
                                      ),
                                  ).length
                                }
                                /{group.subjects.length} included
                              </span>
                            </div>
                            <div className="system-subject-list">
                              {group.subjects.map((subject) => {
                                const key = `${group.groupName}::${subject}`;
                                const checked =
                                  !excludedSubjectKeys.includes(key);
                                return (
                                  <label
                                    key={key}
                                    className="system-checkbox-pill"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        toggleExcludedValue(
                                          key,
                                          excludedSubjectKeys,
                                          setExcludedSubjectKeys,
                                        )
                                      }
                                    />
                                    <span>{subject}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(existingData?.subjects.length ?? 0) > 0 && (
                        <p className="system-section-note">
                          Existing subjects detected:{" "}
                          {existingData?.subjects.length}. Duplicate subject
                          records are skipped by deterministic seed IDs.
                        </p>
                      )}
                    </div>
                  )}
                </section>

                <section className="system-seeder-accordion">
                  <button
                    type="button"
                    className="system-seeder-accordion-header"
                    onClick={() => toggleSection("grading")}
                  >
                    <span>Grading Scales</span>
                    <strong>{selectedScaleCount} selected</strong>
                  </button>
                  {isSectionOpen("grading") && (
                    <div className="system-seeder-accordion-body">
                      <div className="system-detail-grid">
                        {Object.entries(seedGradingScales)
                          .filter(([programKey]) =>
                            selectedProgramSet.has(programKey),
                          )
                          .map(([programKey, scale]) => {
                            const exists = existingGradingScaleKeys.has(
                              `${programKey}:${scale.name}`,
                            );
                            const checked =
                              includeGradingScales &&
                              !excludedScaleKeys.includes(programKey) &&
                              !exists;
                            return (
                              <div
                                key={programKey}
                                className="system-detail-item"
                              >
                                <label className="system-toggle-row">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={exists}
                                    onChange={() => {
                                      if (!includeGradingScales)
                                        setIncludeGradingScales(true);
                                      toggleExcludedValue(
                                        programKey,
                                        excludedScaleKeys,
                                        setExcludedScaleKeys,
                                      );
                                    }}
                                  />
                                  <strong>
                                    {programNameByKey[programKey]} -{" "}
                                    {scale.name}
                                  </strong>
                                </label>
                                <div className="system-range-list">
                                  {scale.ranges.map((range) => (
                                    <span
                                      key={`${range.gradeValue}-${range.minScore}`}
                                    >
                                      {range.gradeValue}: {range.minScore}-
                                      {range.maxScore} ({range.label})
                                    </span>
                                  ))}
                                </div>
                                {exists && <small>Already seeded</small>}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="system-seeder-accordion">
                  <button
                    type="button"
                    className="system-seeder-accordion-header"
                    onClick={() => toggleSection("schemes")}
                  >
                    <span>Grading Schemes</span>
                    <strong>{selectedSchemeCount} selected</strong>
                  </button>
                  {isSectionOpen("schemes") && (
                    <div className="system-seeder-accordion-body">
                      <div className="system-detail-grid">
                        {seedGradingSchemes
                          .filter((scheme) =>
                            selectedProgramSet.has(scheme.programKey),
                          )
                          .map((scheme) => {
                            const exists = existingSchemeNames.has(scheme.name);
                            const checked =
                              !excludedSchemeKeys.includes(scheme.programKey) &&
                              !exists;
                            return (
                              <div
                                key={scheme.name}
                                className="system-detail-item"
                              >
                                <label className="system-toggle-row">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={exists}
                                    onChange={() =>
                                      toggleExcludedValue(
                                        scheme.programKey,
                                        excludedSchemeKeys,
                                        setExcludedSchemeKeys,
                                      )
                                    }
                                  />
                                  <strong>{scheme.name}</strong>
                                </label>
                                <div className="system-range-list">
                                  {scheme.components.map((component) => (
                                    <span key={component.name}>
                                      {component.name}: {component.weight}%
                                    </span>
                                  ))}
                                </div>
                                {exists && <small>Already seeded</small>}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </section>

                <section className="system-seeder-accordion">
                  <button
                    type="button"
                    className="system-seeder-accordion-header"
                    onClick={() => toggleSection("templates")}
                  >
                    <span>Semester Templates</span>
                    <strong>{selectedSemesterTemplateCount} selected</strong>
                  </button>
                  {isSectionOpen("templates") && (
                    <div className="system-seeder-accordion-body">
                      <div className="system-detail-grid">
                        {seedSemesterTemplates
                          .filter((template) =>
                            selectedProgramSet.has(template.programKey),
                          )
                          .map((template) => {
                            const programId = existingProgramsByKey.get(
                              template.programKey,
                            );
                            const assignmentExists =
                              !!programId &&
                              existingSemesterProgramIds.has(programId);
                            const exists =
                              existingSemesterTemplateNames.has(
                                template.name,
                              ) || assignmentExists;
                            const checked =
                              !excludedSemesterTemplateKeys.includes(
                                template.programKey,
                              ) && !exists;
                            return (
                              <div
                                key={template.name}
                                className="system-detail-item"
                              >
                                <label className="system-toggle-row">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={exists}
                                    onChange={() =>
                                      toggleExcludedValue(
                                        template.programKey,
                                        excludedSemesterTemplateKeys,
                                        setExcludedSemesterTemplateKeys,
                                      )
                                    }
                                  />
                                  <strong>{template.name}</strong>
                                </label>
                                <div className="system-range-list">
                                  {template.semesters.map((semester) => (
                                    <span key={semester}>{semester}</span>
                                  ))}
                                </div>
                                {exists && (
                                  <small>Already seeded or assigned</small>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}

            {seedResult && (
              <div className="system-seed-result">
                <strong>
                  {seedResult.success ? "Seed completed" : "Seed response"}
                </strong>
                <span>{seedResult.message}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDataSeederPage;

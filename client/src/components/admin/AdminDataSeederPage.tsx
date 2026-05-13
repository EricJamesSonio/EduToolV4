import { useMemo, useState } from 'react';
import CreateSchoolYearModal from '../CreateSchoolYearModal';
import {
  seedCourses,
  seedGradingSchemes,
  seedGradingScales,
  seedLevels,
  seedPayloadFeatureLabels,
  seedPrograms,
  seedSemesterTemplates,
  seedSubjectGroups,
  seedStrands,
} from '../../constants/orgSeedPresets';
import { useCreateSchoolYear } from '../../hooks/useSchoolYearMutations';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSystemSeedExistingData } from '../../hooks/useSystemSeedExistingData';
import type { CreateSchoolYearDto, SchoolYear } from '../../types/school-year.types';
import type {
  SeedOrganizationDto,
  SeedOrganizationResponse,
} from '../../types/organization.types';

interface AdminDataSeederPageProps {
  isSeeding: boolean;
  seedResult: SeedOrganizationResponse | null;
  onBack: () => void;
  onSeed: (data: SeedOrganizationDto) => void;
}

const uniqueLevelNames = Array.from(new Set(seedLevels.map((level) => level.name)));
const programKeyByName = Object.fromEntries(seedPrograms.map((program) => [program.name, program.key]));
const programNameByKey = Object.fromEntries(seedPrograms.map((program) => [program.key, program.name]));

const AdminDataSeederPage: React.FC<AdminDataSeederPageProps> = ({
  isSeeding,
  seedResult,
  onBack,
  onSeed,
}) => {
  const [schoolYearId, setSchoolYearId] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState(seedPrograms.map((program) => program.key));
  const [selectedCourses, setSelectedCourses] = useState(seedCourses.map((course) => course.code));
  const [selectedStrands, setSelectedStrands] = useState(seedStrands);
  const [selectedLevels, setSelectedLevels] = useState(uniqueLevelNames);
  const [includeGradingScales, setIncludeGradingScales] = useState(true);
  const [isCreateSchoolYearOpen, setIsCreateSchoolYearOpen] = useState(false);

  const { data: schoolYears = [] } = useSchoolYears();
  const createSchoolYearMutation = useCreateSchoolYear();
  const existingDataQuery = useSystemSeedExistingData(schoolYearId);

  const selectedSchoolYear = useMemo(
    () => schoolYears.find((schoolYear) => schoolYear.id === schoolYearId) ?? null,
    [schoolYearId, schoolYears]
  );

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
        (program.courses ?? []).map((course) => course.code)
      ) ?? []
    );
  }, [existingData?.programs]);

  const existingStrandNames = useMemo(() => {
    return new Set(
      existingData?.programs.flatMap((program) =>
        (program.strands ?? []).map((strand) => strand.name)
      ) ?? []
    );
  }, [existingData?.programs]);

  const existingLevelNames = useMemo(() => {
    return new Set((existingData?.levels ?? []).map((level) => level.name));
  }, [existingData?.levels]);

  const existingGradingScaleKeys = useMemo(() => {
    const keys = new Set<string>();
    existingData?.gradingScales.forEach((scale) => {
      const program = existingData.programs.find((item) => item.id === (scale.program_id ?? scale.programId));
      const programKey = program ? (programKeyByName[program.name] ?? program.type) : null;
      if (programKey) keys.add(`${programKey}:${scale.name}`);
    });
    return keys;
  }, [existingData]);

  const existingSchemeNames = useMemo(() => {
    return new Set((existingData?.gradingSchemeTemplates ?? []).map((template) => template.name));
  }, [existingData?.gradingSchemeTemplates]);

  const existingSemesterTemplateNames = useMemo(() => {
    return new Set((existingData?.semesterTemplates ?? []).map((template) => template.name));
  }, [existingData?.semesterTemplates]);

  const existingSemesterProgramIds = useMemo(() => {
    return new Set(
      (existingData?.semesterAssignments ?? []).map((assignment) =>
        assignment.program_id ?? assignment.programId
      )
    );
  }, [existingData?.semesterAssignments]);

  const toggleValue = (
    value: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (existingProgramsByKey.has(value)) return;
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value]
    );
  };

  const handleCreateSchoolYear = async (data: CreateSchoolYearDto) => {
    const result = await createSchoolYearMutation.mutateAsync(data);
    const createdSchoolYear =
      (result as { data?: SchoolYear }).data ?? (result as unknown as SchoolYear);
    if (!createdSchoolYear?.id) return;
    setSchoolYearId(createdSchoolYear.id);
    setIsCreateSchoolYearOpen(false);
  };

  const handleSeed = () => {
    const selectedProgramSet = new Set(selectedPrograms);
    const gradingScales = Object.fromEntries(
      Object.entries(seedGradingScales).filter(([programKey]) =>
        selectedProgramSet.has(programKey) &&
        !existingGradingScaleKeys.has(`${programKey}:${seedGradingScales[programKey].name}`)
      )
    );
    const courses = selectedCourses.filter((courseCode) => !existingCourseCodes.has(courseCode));
    const strands = selectedStrands.filter((strand) => !existingStrandNames.has(strand));

    onSeed({
      schoolYearId,
      programs: selectedPrograms,
      courses: selectedProgramSet.has('college') ? courses : undefined,
      strands: selectedProgramSet.has('shs') ? strands : undefined,
      excludedLevels: uniqueLevelNames.filter(
        (levelName) => !selectedLevels.includes(levelName) || existingLevelNames.has(levelName)
      ),
      gradingScales: includeGradingScales && Object.keys(gradingScales).length > 0
        ? gradingScales
        : undefined,
    });
  };

  const selectableProgramCount = selectedPrograms.length;
  const selectedProgramSet = new Set(selectedPrograms);

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
              Select a school year and seed academic setup presets.
            </p>
          </div>
        </div>
      </div>

      <div className="system-form-card card">
        <div className="system-seeder-section">
          <div className="system-seeder-header">
            <h3 className="card-title">School Year</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateSchoolYearOpen(true)}
            >
              Create School Year
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="seed-school-year">
              Select School Year
            </label>
            <select
              id="seed-school-year"
              className="form-select"
              value={schoolYearId}
              onChange={(event) => setSchoolYearId(event.target.value)}
            >
              <option value="">Choose a school year</option>
              {schoolYears.map((schoolYear) => (
                <option key={schoolYear.id} value={schoolYear.id}>
                  {schoolYear.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSchoolYear && (
          <>
            <div className="system-seeder-section">
              <h3 className="card-title">What This Seeds</h3>
              <p className="system-section-copy">
                The seeder creates the selected academic structure for {selectedSchoolYear.name}.
                Existing records are shown as locked items and will be reused or skipped by the backend.
              </p>
              <div className="system-chip-list">
                {seedPayloadFeatureLabels.map((label) => (
                  <span key={label} className="system-chip">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {existingDataQuery.isFetching && (
              <div className="system-inline-loading">
                <div className="loading-spinner"></div>
                <span className="loading-text">Checking existing seeded data...</span>
              </div>
            )}

            <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Programs</h3>
                <p className="system-section-copy">
                  Programs are the top-level structure. Existing programs stay selected because child data
                  such as courses, levels, and subjects depends on them.
                </p>
                <div className="system-checkbox-list">
                  {seedPrograms.map((program) => (
                    <label key={program.key} className="system-checkbox-row system-checkbox-row-detailed">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.includes(program.key)}
                        disabled={existingProgramsByKey.has(program.key)}
                        onChange={() => toggleValue(program.key, selectedPrograms, setSelectedPrograms)}
                      />
                      <span>
                        <strong>{program.name}</strong>
                        {existingProgramsByKey.has(program.key) && (
                          <small>Already exists, reused for child seeding</small>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
            </div>

            {selectedProgramSet.has('college') && (
              <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Courses</h3>
                <p className="system-section-copy">
                  College courses are seeded only when the College / University program is selected.
                </p>
                <div className="system-checkbox-list">
                  {seedCourses.map((course) => (
                    <label key={course.code} className="system-checkbox-row system-checkbox-row-detailed">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.code)}
                        disabled={existingCourseCodes.has(course.code)}
                        onChange={() => toggleValue(course.code, selectedCourses, setSelectedCourses)}
                      />
                      <span>
                        <strong>{course.code}</strong>
                        {course.name}
                        {existingCourseCodes.has(course.code) && <small>Already seeded</small>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedProgramSet.has('shs') && (
              <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Strands</h3>
                <p className="system-section-copy">
                  Senior High School strands are seeded only when the SHS program is selected.
                </p>
                <div className="system-checkbox-list">
                  {seedStrands.map((strand) => (
                    <label key={strand} className="system-checkbox-row system-checkbox-row-detailed">
                      <input
                        type="checkbox"
                        checked={selectedStrands.includes(strand)}
                        disabled={existingStrandNames.has(strand)}
                        onChange={() => toggleValue(strand, selectedStrands, setSelectedStrands)}
                      />
                      <span>
                        <strong>{strand}</strong>
                        {existingStrandNames.has(strand) && <small>Already seeded</small>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Levels</h3>
                <p className="system-section-copy">
                  Levels follow the selected programs. Already existing level names are shown so the admin
                  can see what is already present for this school year.
                </p>
                <div className="system-checkbox-list">
                  {uniqueLevelNames.map((levelName) => (
                    <label key={levelName} className="system-checkbox-row system-checkbox-row-detailed">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(levelName)}
                        disabled={existingLevelNames.has(levelName)}
                        onChange={() => toggleValue(levelName, selectedLevels, setSelectedLevels)}
                      />
                      <span>
                        <strong>{levelName}</strong>
                        {existingLevelNames.has(levelName) && <small>Exists in this school year</small>}
                      </span>
                    </label>
                  ))}
                </div>
            </div>

            <div className="system-seeder-section system-seeder-section-card">
              <h3 className="card-title">Subjects</h3>
              <p className="system-section-copy">
                Subjects are seeded automatically for selected programs, including major subjects and shared
                minor subjects where the backend preset defines them.
              </p>
              <div className="system-detail-list">
                {seedSubjectGroups
                  .filter((group) => selectedProgramSet.has(group.programKey))
                  .map((group) => (
                    <div key={group.programKey} className="system-detail-item">
                      <strong>{group.name}</strong>
                      <span>{group.detail}</span>
                    </div>
                  ))}
              </div>
              {(existingData?.subjects.length ?? 0) > 0 && (
                <p className="system-section-note">
                  Existing subjects detected: {existingData?.subjects.length}. Duplicate subject records are
                  skipped by deterministic seed IDs.
                </p>
              )}
            </div>

            <div className="system-seeder-section system-seeder-section-card">
              <h3 className="card-title">Grading Scales</h3>
              <p className="system-section-copy">
                These grading scales are attached per selected program and school year.
              </p>
              <label className="system-checkbox-row system-checkbox-row-inline">
                <input
                  type="checkbox"
                  checked={includeGradingScales}
                  onChange={(event) => setIncludeGradingScales(event.target.checked)}
                />
                <span>Include grading scales for selected programs</span>
              </label>
              <div className="system-detail-list">
                {Object.entries(seedGradingScales)
                  .filter(([programKey]) => selectedProgramSet.has(programKey))
                  .map(([programKey, scale]) => {
                    const exists = existingGradingScaleKeys.has(`${programKey}:${scale.name}`);
                    return (
                      <div key={programKey} className="system-detail-item">
                        <strong>{programNameByKey[programKey]} - {scale.name}</strong>
                        <span>{scale.ranges.length} ranges</span>
                        {exists && <small>Already seeded</small>}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="system-seeder-grid">
              <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Grading Scheme Templates</h3>
                <p className="system-section-copy">
                  Templates are seeded automatically for selected programs.
                </p>
                <div className="system-detail-list">
                  {seedGradingSchemes
                    .filter((scheme) => selectedProgramSet.has(scheme.programKey))
                    .map((scheme) => (
                      <div key={scheme.name} className="system-detail-item">
                        <strong>{scheme.name}</strong>
                        <span>
                          {scheme.components.map((component) => `${component.name} ${component.weight}%`).join(', ')}
                        </span>
                        {existingSchemeNames.has(scheme.name) && <small>Already seeded</small>}
                      </div>
                    ))}
                </div>
              </div>

              <div className="system-seeder-section system-seeder-section-card">
                <h3 className="card-title">Semester Templates</h3>
                <p className="system-section-copy">
                  Templates and program assignments are seeded automatically for selected programs.
                </p>
                <div className="system-detail-list">
                  {seedSemesterTemplates
                    .filter((template) => selectedProgramSet.has(template.programKey))
                    .map((template) => {
                      const programId = existingProgramsByKey.get(template.programKey);
                      const assignmentExists = !!programId && existingSemesterProgramIds.has(programId);
                      return (
                        <div key={template.name} className="system-detail-item">
                          <strong>{template.name}</strong>
                          <span>{template.semesters.join(' | ')}</span>
                          {(existingSemesterTemplateNames.has(template.name) || assignmentExists) && (
                            <small>Already seeded or assigned</small>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {seedResult && (
              <div className="system-seed-result">
                <strong>{seedResult.success ? 'Seed completed' : 'Seed response'}</strong>
                <span>{seedResult.message}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={isSeeding || !schoolYearId || selectableProgramCount === 0}
                onClick={handleSeed}
              >
                {isSeeding ? 'Seeding...' : 'Seed Selected Data'}
              </button>
            </div>
          </>
        )}
      </div>

      <CreateSchoolYearModal
        isOpen={isCreateSchoolYearOpen}
        onClose={() => setIsCreateSchoolYearOpen(false)}
        onSubmit={handleCreateSchoolYear}
        isLoading={createSchoolYearMutation.isPending}
        error={createSchoolYearMutation.error?.message || null}
      />
    </div>
  );
};

export default AdminDataSeederPage;

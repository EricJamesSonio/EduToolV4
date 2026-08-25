// frontend/src/components/admin/data-seeder/SeederCard.tsx
"use client";

import { useEffect } from "react";
import { Loader2, CalendarDays, Layers, LayoutList, Scale, BookOpen, BarChart3, Calendar, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useNavigationGuard } from "@/context/NavigationGuardContext";
import { useSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import { useEffectiveSeedData } from "./hooks/useEffectiveSeedData"

import { SchoolYearStep } from "./SchoolYearStep";
import { ProgramStep } from "./ProgramStep";
import { LevelStep } from "./LevelStep";
import { SectionStep } from "./SectionStep";
import { StrandStep } from "./StrandStep";
import { CourseStep } from "./CourseStep";
import { SubjectStep } from "./SubjectStep";
import { GradingScaleStep } from "./GradingScaleStep";
import { GradingSchemeStep } from "./GradingSchemeStep";
import { ProgramCalendarStep } from "./ProgramCalendarStep";
import { SemesterTemplateStep } from "./SemesterTemplateStep";
import { LEVEL_DEFS } from "./constants/seed-data";
import { useSeederCard } from "./hooks/useSeederCard";

function Card({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`icon-container bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD] shrink-0 mt-0.5`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg leading-tight not-interactive">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  )
}

export function SeederCard() {
  const { data: savedProfileDepartments = [] } = useSchoolProfile();
  const overrides = useEffectiveSeedData(savedProfileDepartments);
  const hasPreset = savedProfileDepartments.length > 0
  const allowedProgramTypes = hasPreset ? new Set(savedProfileDepartments.map((d) => d.type)) : null

  const {
    schoolYears,
    syLoading,
    selectedSchoolYearId,
    setSelectedSchoolYearId,
    handleCreateSchoolYear,
    handleConfirmShortDuration,
    pendingSchoolYear,
    setPendingSchoolYear,
    createSchoolYearMutation,
    seedMutation,
    handleSeed,
    handleApplyPreset,
    summaryText,
    summaryItems,
    derivedSelectedLevels,
    existingProgramTypes,
    existingCourseCodes,
    existingStrandNames,
    existingLevelNames,
    existingSubjectTitles,
    helpers,
    selectedPrograms,
    selectedCourses,
    selectedStrands,
    selectedSubjects,
    allSelectableSubjects,
    levelConfigs,
    setLevelCount,
    renameLevelAt,
    sectionConfigs,
    setSectionsForLevel,
    selectedLevelKeys,
    selectedSectionKeys,
    toLevelKey,
    toSectionKey,
    toggleLevelKey,
    toggleSectionKey,
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
    seedProgramCalendars,
    setSeedProgramCalendars,
    programCalendarConfigs,
    initProgramCalendar,
    updateProgramCalendar,
    selectedSchoolYear,
      existingGradingScaleNames,
  existingGradingSchemeNames,
  existingSemesterTemplateNames,
  } = useSeederCard(overrides);

  // ===== Navigation guard: don't let the user silently lose an in-progress
  // seed by clicking away in the sidebar. "In progress" = at least one
  // department has been selected â€” matches the point where real, non-trivial
  // choices start piling up (levels, sections, subjects, calendars, etc. all
  // key off the selected departments).
  const { setGuard } = useNavigationGuard();

  useEffect(() => {
    setGuard(() => selectedPrograms.size > 0);
    return () => setGuard(null);
  }, [selectedPrograms, setGuard]);

  // Same protection for tab close / refresh / typed-URL navigation, which the
  // sidebar guard can't catch since it only intercepts our own <Link> clicks.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (selectedPrograms.size > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedPrograms]);

  return (
    <>
      <div className="space-y-6">
        {/* School Year */}
        <Card id="school-year" icon={CalendarDays} title="School Year">
          <SchoolYearStep
            schoolYears={schoolYears}
            isLoading={syLoading}
            selectedId={selectedSchoolYearId}
            onSelect={setSelectedSchoolYearId}
            onCreate={handleCreateSchoolYear}
            isCreating={createSchoolYearMutation.isPending}
          />
        </Card>

        <div
          className={cn(
            "space-y-6 transition-opacity",
            !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : "",
          )}
        >
          {/* Apply Preset â€” only when a preset exists and the selected school year is fresh (no seeded departments yet) */}
          {selectedSchoolYearId && savedProfileDepartments.length > 0 && existingProgramTypes.size === 0 && (
            <Card id="preset" icon={Sparkles} title="Apply Preset">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Preset available from School Profile</p>
                  <p className="text-xs text-muted-foreground not-interactive">
                    This school year has no data yet. Apply your saved preset ({savedProfileDepartments.map((d) => d.type).join(", ")}) to seed departments, levels, sections and subjects in one click.
                  </p>
                </div>
                <Button
                  onClick={() => handleApplyPreset(savedProfileDepartments)}
                  disabled={seedMutation.isPending}
                  className="shrink-0 gap-1.5"
                >
                  {seedMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Apply Preset
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Programs â€” when preset exists, only its departments are selectable */}
          <Card id="programs" icon={Layers} title="Departments">
            <ProgramStep
              selectedPrograms={selectedPrograms}
              disabledProgramTypes={existingProgramTypes}
              onToggleProgram={helpers.toggleProgram}
              onSelectAllPrograms={helpers.selectAllPrograms}
              onDeselectAllPrograms={helpers.deselectAllPrograms}
              allowedProgramTypes={allowedProgramTypes}
            />
          </Card>

          {/* Strands (SHS) â€” before Levels because Levels depend on selected Strands */}
          {selectedPrograms.has("shs") && (
            <Card id="strands" icon={BookOpen} title="SHS Strands">
              <StrandStep
                selectedStrands={selectedStrands}
                disabledStrandNames={existingStrandNames}
                onToggleStrand={helpers.toggleStrand}
                onSelectAllStrands={helpers.selectAllStrands}
                onDeselectAllStrands={helpers.deselectAllStrands}
                strandsOverride={overrides.shsStrands}
              />
            </Card>
          )}

          {/* Courses (College) â€” before Levels because Levels depend on selected Courses (e.g. BSA 5yr vs 4yr) */}
          {selectedPrograms.has("college") && (
            <Card id="courses" icon={BookOpen} title="College Courses">
              <CourseStep
                selectedCourses={selectedCourses}
                disabledCourseCodes={existingCourseCodes}
                onToggleCourse={helpers.toggleCourse}
                onSelectAllCourses={helpers.selectAllCourses}
                onDeselectAllCourses={helpers.deselectAllCourses}
                coursesOverride={overrides.collegeCourses}
              />
            </Card>
          )}

          {/* Levels â€” also show when an override defines levels for a program; seeder is read-only (select/unselect only, edit in Configure) */}
          {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p] || !!overrides.levelDefsByEntity[p]) && (
            <Card id="levels" icon={LayoutList} title="Levels">
              <LevelStep
                selectedPrograms={selectedPrograms}
                selectedCourses={selectedCourses}
                selectedStrands={selectedStrands}
                disabledLevelNames={existingLevelNames}
                levelConfigs={levelConfigs}
                onSetCount={setLevelCount}
                onRenameAt={renameLevelAt}
                coursesOverride={overrides.collegeCourses}
                strandsOverride={overrides.shsStrands}
                levelDefsOverride={overrides.levelDefsByEntity}
                readOnly
                selectedLevelKeys={selectedLevelKeys}
                onToggleLevel={toggleLevelKey}
                toLevelKey={toLevelKey}
              />
            </Card>
          )}

          {/* Sections â€” after Levels; read-only */}
          {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p] || !!overrides.levelDefsByEntity[p]) && (
            <Card id="sections" icon={Scale} title="Sections">
              <SectionStep
                selectedPrograms={selectedPrograms}
                selectedCourses={selectedCourses}
                selectedStrands={selectedStrands}
                levelConfigs={levelConfigs}
                sectionConfigs={sectionConfigs}
                onSetSections={setSectionsForLevel}
                coursesOverride={overrides.collegeCourses}
                strandsOverride={overrides.shsStrands}
                levelDefsOverride={overrides.levelDefsByEntity}
                sectionsOverride={overrides.sectionsByLevelName}
                readOnly
                selectedLevelKeys={selectedLevelKeys}
                selectedSectionKeys={selectedSectionKeys}
                onToggleSection={toggleSectionKey}
                toLevelKey={toLevelKey}
                toSectionKey={toSectionKey}
              />
            </Card>
          )}

          {/* Subjects */}
          <Card id="subjects" icon={BookOpen} title="Subjects">
            <SubjectStep
              selectedPrograms={selectedPrograms}
              selectedLevels={derivedSelectedLevels}
              selectedStrands={selectedStrands}
              selectedCourses={selectedCourses}
              selectedSubjects={selectedSubjects}
              disabledSubjectTitles={existingSubjectTitles}
              onToggleSubject={helpers.toggleSubject}
              onSelectAllForGroup={helpers.selectAllForGroup}
              onDeselectAllForGroup={helpers.deselectAllForGroup}
              allSelectableSubjects={allSelectableSubjects}
              levelSubjectsOverride={overrides.levelSubjectsByLevelName}
              courseSubjectsOverride={overrides.courseSubjectsByCode}
              strandSubjectsOverride={overrides.strandSubjectsByName}
              levelDefsOverride={overrides.levelDefsByEntity}
            />
          </Card>

          {/* Grading & Templates */}
          {selectedPrograms.size > 0 && (
            <>
              <Card id="grading-scale" icon={BarChart3} title="Grading Scale">
                <GradingScaleStep
                  selectedPrograms={selectedPrograms}
                  seedGradingScale={seedGradingScale}
                  gradingScaleByProgram={gradingScaleByProgram}
                  disabledScaleNames={existingGradingScaleNames}
                  onToggleSeed={setSeedGradingScale}
                  onSelectPreset={setGradingScaleForProgram}
                />
              </Card>

              <Card id="grading-scheme" icon={Scale} title="Grading Scheme">
                <GradingSchemeStep
                  selectedPrograms={selectedPrograms}
                  seedGradingSchemes={seedGradingSchemes}
                  gradingSchemesByProgram={gradingSchemesByProgram}
                  disabledSchemeNames={existingGradingSchemeNames}
                  onToggleSeed={setSeedGradingSchemes}
                  onToggleScheme={toggleGradingScheme}
                />
              </Card>

              <Card id="program-calendars" icon={Calendar} title="Academic Calendar">
                <ProgramCalendarStep
                  selectedPrograms={selectedPrograms}
                  seedProgramCalendars={seedProgramCalendars}
                  programCalendarConfigs={programCalendarConfigs}
                  onToggleSeed={setSeedProgramCalendars}
                  onInitProgramCalendar={initProgramCalendar}
                  onUpdateProgramCalendar={updateProgramCalendar}
                  semesterTemplatesByProgram={semesterTemplatesByProgram}
                  schoolYearStart={selectedSchoolYear?.start_date ?? undefined}
                  schoolYearEnd={selectedSchoolYear?.end_date ?? undefined}
                />
              </Card>

              <Card id="semester-templates" icon={Calendar} title="Semester Templates">
                <SemesterTemplateStep
                  selectedPrograms={selectedPrograms}
                  seedSemesterTemplates={seedSemesterTemplates}
                  semesterTemplatesByProgram={semesterTemplatesByProgram}
                  seedProgramCalendars={seedProgramCalendars}
                  programCalendarConfigs={programCalendarConfigs}
                  disabledTemplateNames={existingSemesterTemplateNames}
                  onToggleSeed={setSeedSemesterTemplates}
                  onToggleTemplate={toggleSemesterTemplate}
                />
              </Card>
            </>
          )}

          {/* Summary + Apply */}
          <Card id="summary" icon={Database} title="Summary">
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              {summaryItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
                    >
                      <span className="truncate text-xs text-muted-foreground not-interactive">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold tabular-nums not-interactive">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground not-interactive text-center py-1">
                  Select a school year and at least one department to review what will be seeded.
                </p>
              )}

              <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground not-interactive min-w-0">
                  {summaryText}
                </p>
                <Button
                  onClick={handleSeed}
                  disabled={
                    seedMutation.isPending ||
                    !selectedSchoolYearId ||
                    selectedPrograms.size === 0
                  }
                  className="shrink-0"
                >
                  {seedMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Apply Seed
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingSchoolYear}
        title="School year looks short"
        message="This school year doesn't span a full year. This might be a mistake â€” are you sure you want to proceed?"
        confirmLabel="Yes, create it"
        destructive={false}
        isLoading={createSchoolYearMutation.isPending}
        onConfirm={handleConfirmShortDuration}
        onOpenChange={(o) => {
          if (!o) setPendingSchoolYear(null);
        }}
      />
    </>
  );
}
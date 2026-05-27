// frontend/src/components/admin/data-seeder/SeederCard.tsx
"use client";

import { Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { SchoolYearStep } from "./SchoolYearStep";
import { ProgramStep } from "./ProgramStep";
import { LevelStep } from "./LevelStep";
import { SectionStep } from "./SectionStep";
import { StrandStep } from "./StrandStep";
import { CourseStep } from "./CourseStep";
import { SubjectStep } from "./SubjectStep";
import { GradingScaleStep } from "./GradingScaleStep";
import { GradingSchemeStep } from "./GradingSchemeStep";
import { SemesterTemplateStep } from "./SemesterTemplateStep";
import { LEVEL_DEFS } from "./constants/seed-data";
import { useSeederCard } from "./hooks/useSeederCard";

export function SeederCard() {
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
    summaryText,
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
  } = useSeederCard();

  return (
    <>
      <div className="space-y-6">
        {/* School Year */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <SchoolYearStep
            schoolYears={schoolYears}
            isLoading={syLoading}
            selectedId={selectedSchoolYearId}
            onSelect={setSelectedSchoolYearId}
            onCreate={handleCreateSchoolYear}
            isCreating={createSchoolYearMutation.isPending}
          />
        </div>

        <div
          className={cn(
            "space-y-6 transition-opacity",
            !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : "",
          )}
        >
          {/* Programs */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <ProgramStep
              selectedPrograms={selectedPrograms}
              disabledProgramTypes={existingProgramTypes}
              onToggleProgram={helpers.toggleProgram}
              onSelectAllPrograms={helpers.selectAllPrograms}
              onDeselectAllPrograms={helpers.deselectAllPrograms}
            />
          </div>

          {/* Levels */}
          {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <LevelStep
                selectedPrograms={selectedPrograms}
                selectedCourses={selectedCourses}
                selectedStrands={selectedStrands}
                disabledLevelNames={existingLevelNames}
                levelConfigs={levelConfigs}
                onSetCount={setLevelCount}
                onRenameAt={renameLevelAt}
              />
            </div>
          )}

          {/* Sections */}
          {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <SectionStep
                selectedPrograms={selectedPrograms}
                selectedCourses={selectedCourses}
                selectedStrands={selectedStrands}
                levelConfigs={levelConfigs}
                sectionConfigs={sectionConfigs}
                onSetSections={setSectionsForLevel}
              />
            </div>
          )}

          {/* Strands (SHS) */}
          {selectedPrograms.has("shs") && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <StrandStep
                selectedStrands={selectedStrands}
                disabledStrandNames={existingStrandNames}
                onToggleStrand={helpers.toggleStrand}
                onSelectAllStrands={helpers.selectAllStrands}
                onDeselectAllStrands={helpers.deselectAllStrands}
              />
            </div>
          )}

          {/* Courses (College) */}
          {selectedPrograms.has("college") && (
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <CourseStep
                selectedCourses={selectedCourses}
                disabledCourseCodes={existingCourseCodes}
                onToggleCourse={helpers.toggleCourse}
                onSelectAllCourses={helpers.selectAllCourses}
                onDeselectAllCourses={helpers.deselectAllCourses}
              />
            </div>
          )}

          {/* Subjects */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
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
            />
          </div>

          {/* Grading & Templates */}
          {selectedPrograms.size > 0 && (
            <>
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <GradingScaleStep
                  selectedPrograms={selectedPrograms}
                  seedGradingScale={seedGradingScale}
                  gradingScaleByProgram={gradingScaleByProgram}
                  onToggleSeed={setSeedGradingScale}
                  onSelectPreset={setGradingScaleForProgram}
                />
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <GradingSchemeStep
                  selectedPrograms={selectedPrograms}
                  seedGradingSchemes={seedGradingSchemes}
                  gradingSchemesByProgram={gradingSchemesByProgram}
                  onToggleSeed={setSeedGradingSchemes}
                  onToggleScheme={toggleGradingScheme}
                />
              </div>

              <div className="rounded-xl border bg-card p-6 space-y-4">
                <SemesterTemplateStep
                  selectedPrograms={selectedPrograms}
                  seedSemesterTemplates={seedSemesterTemplates}
                  semesterTemplatesByProgram={semesterTemplatesByProgram}
                  onToggleSeed={setSeedSemesterTemplates}
                  onToggleTemplate={toggleSemesterTemplate}
                />
              </div>
            </>
          )}

          {/* Summary + Apply */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex flex-row items-center justify-between">
              <p className="text-sm text-muted-foreground">{summaryText}</p>
              <Button
                onClick={handleSeed}
                disabled={
                  seedMutation.isPending ||
                  !selectedSchoolYearId ||
                  selectedPrograms.size === 0
                }
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
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingSchoolYear}
        title="School year looks short"
        message="This school year doesn't span a full year. This might be a mistake — are you sure you want to proceed?"
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

// frontend/src/components/admin/organization/SeederCard.tsx
"use client";

import { ChevronDown, ChevronRight, Database, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

    // UI
    collapsed,
    setCollapsed,
    summaryText,
    derivedSelectedLevels,

    // Disabled sets
    existingProgramTypes,
    existingCourseCodes,
    existingStrandNames,
    existingLevelNames,
    existingSubjectTitles,

    // Helpers
    helpers,

    // Seed state pass-through
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
    resolvedGradingScales,
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
      <div className="rounded-lg border bg-card">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Data Seeder
            </span>
          </div>
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {!collapsed && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-sm text-muted-foreground -mt-1">
              Seed your organization with programs, levels, subjects, grading
              scales, schemes, and semester templates. Already-seeded items
              appear grayed out.
            </p>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                School Year <span className="text-destructive ml-0.5">*</span>
              </Label>
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
                "space-y-5 transition-opacity",
                !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : "",
              )}
            >
              <ProgramStep
                selectedPrograms={selectedPrograms}
                disabledProgramTypes={existingProgramTypes}
                onToggleProgram={helpers.toggleProgram}
                onSelectAllPrograms={helpers.selectAllPrograms}
                onDeselectAllPrograms={helpers.deselectAllPrograms}
              />

              {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
                <LevelStep
                  selectedPrograms={selectedPrograms}
                  disabledLevelNames={existingLevelNames}
                  levelConfigs={levelConfigs}
                  onSetCount={setLevelCount}
                  onRenameAt={renameLevelAt}
                />
              )}

              {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
                <SectionStep
                  selectedPrograms={selectedPrograms}
                  levelConfigs={levelConfigs}
                  sectionConfigs={sectionConfigs}
                  onSetSections={setSectionsForLevel}
                />
              )}

              {selectedPrograms.has("shs") && (
                <StrandStep
                  selectedStrands={selectedStrands}
                  disabledStrandNames={existingStrandNames}
                  onToggleStrand={helpers.toggleStrand}
                  onSelectAllStrands={helpers.selectAllStrands}
                  onDeselectAllStrands={helpers.deselectAllStrands}
                />
              )}

              {selectedPrograms.has("college") && (
                <CourseStep
                  selectedCourses={selectedCourses}
                  disabledCourseCodes={existingCourseCodes}
                  onToggleCourse={helpers.toggleCourse}
                  onSelectAllCourses={helpers.selectAllCourses}
                  onDeselectAllCourses={helpers.deselectAllCourses}
                />
              )}

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

              {selectedPrograms.size > 0 && (
                <div className="border-t pt-5 space-y-5">
                  <GradingScaleStep
                    selectedPrograms={selectedPrograms}
                    seedGradingScale={seedGradingScale}
                    gradingScaleByProgram={gradingScaleByProgram}
                    onToggleSeed={setSeedGradingScale}
                    onSelectPreset={setGradingScaleForProgram}
                  />

                  <GradingSchemeStep
                    selectedPrograms={selectedPrograms}
                    seedGradingSchemes={seedGradingSchemes}
                    gradingSchemesByProgram={gradingSchemesByProgram}
                    onToggleSeed={setSeedGradingSchemes}
                    onToggleScheme={toggleGradingScheme}
                  />

                  <SemesterTemplateStep
                    selectedPrograms={selectedPrograms}
                    seedSemesterTemplates={seedSemesterTemplates}
                    semesterTemplatesByProgram={semesterTemplatesByProgram}
                    onToggleSeed={setSeedSemesterTemplates}
                    onToggleTemplate={toggleSemesterTemplate}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">{summaryText}</p>
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
        )}
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
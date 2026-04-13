"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import { organizationApi } from "@/api/admin/organization.api"
import { schoolYearApi } from "@/api/admin/school-year.api"
import { programApi } from "@/api/admin/program.api"
import { courseApi } from "@/api/admin/course.api"
import { strandApi } from "@/api/admin/strand.api"
import { levelApi } from "@/api/admin/level.api"
import { subjectApi } from "@/api/admin/subject.api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { CalendarDays, ChevronDown, ChevronRight, Database, Loader2 } from "lucide-react"

import { SchoolYearStep } from "./SchoolYearStep"
import { ProgramStep } from "./ProgramStep"
import { LevelStep } from "./LevelStep"
import { SectionStep } from "./SectionStep"
import { StrandStep } from "./StrandStep"
import { CourseStep } from "./CourseStep"
import { SubjectStep } from "./SubjectStep"
import { GradingScaleStep } from "./GradingScaleStep"
import { GradingSchemeStep } from "./GradingSchemeStep"
import { SemesterTemplateStep } from "./SemesterTemplateStep"
import { useSeedState } from "./hooks/useSeedState"
import {
  COLLEGE_COURSES,
  LEVEL_DEFS,
  PROGRAMS,
  SHS_STRANDS,
  SECTION_DEFAULTS,
  parseSubjectKey,
} from "./constants/seed-data"

interface PendingSchoolYear {
  name:        string
  start_date?: string
  end_date?:   string
}

function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) && err.response?.data?.error === "SHORT_DURATION_WARNING"
  )
}

export function SeederCard() {
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingSchoolYear, setPendingSchoolYear] = useState<PendingSchoolYear | null>(null)

  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  })

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null)

  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active")
      if (active) setSelectedSchoolYearId(active.id)
    }
  }, [schoolYears, selectedSchoolYearId])

  const createSchoolYearMutation = useMutation({
    mutationFn: ({
      name,
      start_date,
      end_date,
      confirm_short_duration,
    }: {
      name:                   string
      start_date?:            string
      end_date?:              string
      confirm_short_duration?: boolean
    }) => schoolYearApi.create({ name, start_date, end_date, confirm_short_duration }),
    onSuccess: (result) => {
      const created = (result as any).data ?? result
      toast.success(`School year "${created.name}" created.`)
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] })
      setSelectedSchoolYearId(created.id)
      setPendingSchoolYear(null)
    },
    onError: (err: unknown, variables) => {
      if (isShortDurationError(err)) {
        setPendingSchoolYear({
          name:       variables.name,
          start_date: variables.start_date,
          end_date:   variables.end_date,
        })
        return
      }
      toast.error("Failed to create school year.")
    },
  })

  function handleConfirmShortDuration() {
    if (!pendingSchoolYear) return
    createSchoolYearMutation.mutate({
      ...pendingSchoolYear,
      confirm_short_duration: true,
    })
  }

  function handleCreateSchoolYear(name: string, start_date?: string, end_date?: string) {
    createSchoolYearMutation.mutate({ name, start_date, end_date })
  }

  const { data: existingPrograms = [] } = useQuery({
    queryKey: ["admin", "programs", selectedSchoolYearId],
    queryFn:  () => programApi.getAll(selectedSchoolYearId!),
    enabled:  !!selectedSchoolYearId,
  })

  const { data: existingCourses = [] } = useQuery({
    queryKey: ["admin", "courses", selectedSchoolYearId],
    queryFn:  () => courseApi.getAll({ schoolYearId: selectedSchoolYearId! }),
    enabled:  !!selectedSchoolYearId,
  })

  const { data: existingStrands = [] } = useQuery({
    queryKey: ["admin", "strands", selectedSchoolYearId],
    queryFn:  async () => {
      try {
        const result = await strandApi.getAll()
        return Array.isArray(result) ? result : []
      } catch {
        return []
      }
    },
    enabled: !!selectedSchoolYearId,
  })

  const { data: existingLevels = [] } = useQuery({
    queryKey: ["admin", "levels", selectedSchoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(selectedSchoolYearId!),
    enabled:  !!selectedSchoolYearId,
  })

  const { data: existingSubjects = [] } = useQuery({
    queryKey: ["admin", "subjects", selectedSchoolYearId],
    queryFn:  () => subjectApi.getAll({ schoolYearId: selectedSchoolYearId }),
    enabled:  !!selectedSchoolYearId,
  })

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
    setLevelCount,
    renameLevelAt,
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
    toggleSet,
    selectAll,
    deselectAll,
    sectionConfigs,
    setSectionsForLevel,
  } = useSeedState()

  const seedMutation = useMutation({
    mutationFn: organizationApi.seedOrg,
    onSuccess: () => {
      toast.success("Seed completed! Your programs, levels, and subjects are ready.")
      setCollapsed(true)
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "strands"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "levels"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })
    },
    onError: () => toast.error("Seed failed. Please try again."),
  })

  function handleSeed() {
    if (!selectedSchoolYearId) {
      toast.error("Select or create a school year first.")
      return
    }
    if (selectedPrograms.size === 0) {
      toast.error("Select at least one program.")
      return
    }

    const excludedLevelSubjects: Record<string, string[]> = {}
    allSelectableSubjects
      .filter((key) => !selectedSubjects.has(key))
      .forEach((key) => {
        const { groupName, subjectName } = parseSubjectKey(key)
        if (!groupName) return
        if (!excludedLevelSubjects[groupName]) excludedLevelSubjects[groupName] = []
        excludedLevelSubjects[groupName].push(subjectName)
      })

    const levelConfigsPayload = Object.fromEntries(
      Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .map((p) => [p, levelConfigs[p]?.names ?? LEVEL_DEFS[p]]),
    )

    const sectionConfigsPayload = Object.fromEntries(
      Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p] ?? [])
        .map((levelName) => [
          levelName,
          sectionConfigs[levelName] ?? SECTION_DEFAULTS,
        ]),
    )

    const gradingScales = seedGradingScale
      ? Object.fromEntries(
          Object.entries(resolvedGradingScales).map(([prog, preset]) => [
            prog,
            { presetKey: preset.key, name: preset.name, ranges: preset.ranges },
          ]),
        )
      : undefined

    seedMutation.mutate({
      schoolYearId: selectedSchoolYearId,
      programs:     Array.from(selectedPrograms),
      courses:      selectedPrograms.has("college") ? Array.from(selectedCourses) : undefined,
      strands:      selectedPrograms.has("shs") ? Array.from(selectedStrands) : undefined,
      levelConfigs: Object.keys(levelConfigsPayload).length > 0 ? levelConfigsPayload : undefined,
      sectionConfigs: sectionConfigsPayload,
      excludedLevelSubjects: Object.keys(excludedLevelSubjects).length > 0 ? excludedLevelSubjects : undefined,
      gradingScales,
    })
  }

  const existingProgramTypes = new Set(existingPrograms.map((p) => p.type))
  const existingCourseCodes = new Set(existingCourses.map((c) => c.code?.trim()).filter(Boolean))
  const existingStrandNames = new Set(existingStrands.map((s) => s.name))
  const existingLevelNames = new Set(existingLevels.map((l) => l.name))
  const existingSubjectTitles = new Set(existingSubjects.map((s) => s.title))

  const helpers = {
    toggleProgram:      (key: string) => toggleSet(selectedPrograms, key, setSelectedPrograms),
    selectAllPrograms:  () => selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms),
    deselectAllPrograms: () => deselectAll(setSelectedPrograms),
    toggleStrand:       (s: string) => toggleSet(selectedStrands, s, setSelectedStrands),
    selectAllStrands:   () => selectAll(SHS_STRANDS, setSelectedStrands),
    deselectAllStrands: () => deselectAll(setSelectedStrands),
    toggleCourse:       (c: string) => toggleSet(selectedCourses, c, setSelectedCourses),
    selectAllCourses:   () => selectAll(COLLEGE_COURSES.map((c) => c.code ?? ""), setSelectedCourses),
    deselectAllCourses: () => deselectAll(setSelectedCourses),
    toggleSubject:      (key: string) => toggleSet(selectedSubjects, key, setSelectedSubjects),
    selectAllForGroup:  (keys: string[]) => {
      const n = new Set(selectedSubjects)
      keys.forEach((k) => n.add(k))
      setSelectedSubjects(n)
    },
    deselectAllForGroup: (keys: string[]) => {
      const n = new Set(selectedSubjects)
      keys.forEach((k) => n.delete(k))
      setSelectedSubjects(n)
    },
  }

  const totalLevelCount = Array.from(selectedPrograms)
    .filter((p) => LEVEL_DEFS[p])
    .reduce((sum, p) => sum + (levelConfigs[p]?.count ?? LEVEL_DEFS[p].length), 0)

  const totalSectionCount = Array.from(selectedPrograms)
    .filter((p) => LEVEL_DEFS[p])
    .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p] ?? [])
    .reduce((sum, lvl) => sum + (sectionConfigs[lvl]?.length ?? 2), 0)

  const selectedGradingSchemes = Array.from(selectedPrograms).filter(
    (p) => gradingSchemesByProgram[p] !== false
  ).length
  const selectedSemesterTemplates = Array.from(selectedPrograms).filter(
    (p) => semesterTemplatesByProgram[p] !== false
  ).length

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
        seedGradingSchemes && `${selectedGradingSchemes} grading scheme(s)`,
        seedSemesterTemplates && `${selectedSemesterTemplates} semester template(s)`,
      ]
        .filter(Boolean)
        .join(" · ")

  const derivedSelectedLevels = new Set(
    Array.from(selectedPrograms)
      .filter((p) => LEVEL_DEFS[p])
      .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p]),
  )

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
              Seed your organization with programs, levels, subjects, grading scales, schemes, and semester templates.
              Already-seeded items appear grayed out.
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
          if (!o) setPendingSchoolYear(null)
        }}
      />
    </>
  )
}
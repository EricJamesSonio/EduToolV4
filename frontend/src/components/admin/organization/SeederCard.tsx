// frontend/src/components/admin/organization/SeederCard.tsx

"use client"

import { useEffect, useState }                        from "react"
import { useQuery, useMutation, useQueryClient }      from "@tanstack/react-query"
import { toast }                                       from "sonner"
import { isAxiosError }                               from "axios"

import { organizationApi } from "@/api/admin/organization.api"
import { schoolYearApi }   from "@/api/admin/school-year.api"

import { Button }   from "@/components/ui/button"
import { Label }    from "@/components/ui/label"
import { cn }       from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  CalendarDays, ChevronDown, ChevronRight, Database, Loader2,
} from "lucide-react"

import { SchoolYearStep }   from "./SchoolYearStep"
import { ProgramStep }      from "./ProgramStep"
import { LevelStep }        from "./LevelStep"
import { SectionStep }      from "./SectionStep"
import { StrandStep }       from "./StrandStep"
import { CourseStep }       from "./CourseStep"
import { SubjectStep }      from "./SubjectStep"
import { GradingScaleStep } from "./GradingScaleStep"
import { useSeedState }     from "./hooks/useSeedState"
import {
  COLLEGE_COURSES, LEVEL_DEFS, PROGRAMS, SHS_STRANDS, SECTION_DEFAULTS,
} from "./constants/seed-data"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingSchoolYear {
  name:        string
  start_date?: string
  end_date?:   string
}

function isShortDurationError(err: unknown): boolean {
  return (
    isAxiosError(err) &&
    err.response?.data?.error === "SHORT_DURATION_WARNING"
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SeederCard() {
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)

  // Short-duration warning state
  const [pendingSchoolYear, setPendingSchoolYear] =
    useState<PendingSchoolYear | null>(null)

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
      name, start_date, end_date, confirm_short_duration,
    }: {
      name:                    string
      start_date?:             string
      end_date?:               string
      confirm_short_duration?: boolean
    }) => schoolYearApi.create({ name, start_date, end_date, confirm_short_duration }),

    onSuccess: (result) => {
      // schoolYearApi.create returns SchoolYearCreateResult — extract .data
      const created = (result as any).data ?? result
      toast.success(`School year "${created.name}" created.`)
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] })
      setSelectedSchoolYearId(created.id)
      setPendingSchoolYear(null)
    },

    onError: (err: unknown, variables) => {
      if (isShortDurationError(err)) {
        // Store pending payload and show confirmation dialog
        setPendingSchoolYear({
          name:        variables.name,
          start_date:  variables.start_date,
          end_date:    variables.end_date,
        })
        return
      }
      toast.error("Failed to create school year.")
    },
  })

  // Called when user confirms despite the short-duration warning
  function handleConfirmShortDuration() {
    if (!pendingSchoolYear) return
    createSchoolYearMutation.mutate({
      ...pendingSchoolYear,
      confirm_short_duration: true,
    })
  }

  // Called by SchoolYearStep on first attempt (no confirm flag)
  function handleCreateSchoolYear(name: string, start_date?: string, end_date?: string) {
    createSchoolYearMutation.mutate({ name, start_date, end_date })
  }

  // ── seed state ─────────────────────────────────────────────────────────────

  const {
    selectedPrograms,  setSelectedPrograms,
    selectedCourses,   setSelectedCourses,
    selectedStrands,   setSelectedStrands,
    selectedSubjects,  setSelectedSubjects,
    allSelectableSubjects,
    levelConfigs, setLevelCount, renameLevelAt,
    seedGradingScale,      setSeedGradingScale,
    gradingScaleByProgram, setGradingScaleForProgram,
    resolvedGradingScales,
    toggleSet, selectAll, deselectAll,
    sectionConfigs, setSectionsForLevel,
  } = useSeedState()

  const seedMutation = useMutation({
    mutationFn: organizationApi.seedOrg,
    onSuccess: () => {
      toast.success("Seed completed! Your programs, levels, and subjects are ready.")
      setCollapsed(true)
    },
    onError: () => toast.error("Seed failed. Please try again."),
  })

  function handleSeed() {
    if (!selectedSchoolYearId) { toast.error("Select or create a school year first."); return }
    if (selectedPrograms.size === 0) { toast.error("Select at least one program."); return }

    const excludedSubjects = allSelectableSubjects.filter((s) => !selectedSubjects.has(s))

    const levelConfigsPayload = Object.fromEntries(
      Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .map((p) => [p, levelConfigs[p]?.names ?? LEVEL_DEFS[p]]),
    )

    const sectionConfigsPayload = Object.fromEntries(
      Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p] ?? [])
        .map((levelName) => [levelName, sectionConfigs[levelName] ?? SECTION_DEFAULTS]),
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
      schoolYearId:    selectedSchoolYearId,
      programs:        Array.from(selectedPrograms),
      courses:         selectedPrograms.has("college") ? Array.from(selectedCourses) : undefined,
      strands:         selectedPrograms.has("shs")     ? Array.from(selectedStrands) : undefined,
      levelConfigs:    Object.keys(levelConfigsPayload).length > 0 ? levelConfigsPayload : undefined,
      sectionConfigs:  sectionConfigsPayload,
      excludedSubjects: excludedSubjects.length > 0 ? excludedSubjects : undefined,
      gradingScales,
    })
  }

  const helpers = {
    toggleProgram:       (key: string)    => toggleSet(selectedPrograms, key, setSelectedPrograms),
    selectAllPrograms:   ()               => selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms),
    deselectAllPrograms: ()               => deselectAll(setSelectedPrograms),
    toggleStrand:        (s: string)      => toggleSet(selectedStrands, s, setSelectedStrands),
    selectAllStrands:    ()               => selectAll(SHS_STRANDS, setSelectedStrands),
    deselectAllStrands:  ()               => deselectAll(setSelectedStrands),
    toggleCourse:        (c: string)      => toggleSet(selectedCourses, c, setSelectedCourses),
    selectAllCourses:    ()               => selectAll(COLLEGE_COURSES.map((c) => c.code), setSelectedCourses),
    deselectAllCourses:  ()               => deselectAll(setSelectedCourses),
    toggleSubject:       (s: string)      => toggleSet(selectedSubjects, s, setSelectedSubjects),
    selectAllForGroup:   (subs: string[]) => {
      const n = new Set(selectedSubjects); subs.forEach((s) => n.add(s)); setSelectedSubjects(n)
    },
    deselectAllForGroup: (subs: string[]) => {
      const n = new Set(selectedSubjects); subs.forEach((s) => n.delete(s)); setSelectedSubjects(n)
    },
  }

  const totalLevelCount = Array.from(selectedPrograms)
    .filter((p) => LEVEL_DEFS[p])
    .reduce((sum, p) => sum + (levelConfigs[p]?.count ?? LEVEL_DEFS[p].length), 0)

  const totalSectionCount = Array.from(selectedPrograms)
    .filter((p) => LEVEL_DEFS[p])
    .flatMap((p) => levelConfigs[p]?.names ?? LEVEL_DEFS[p] ?? [])
    .reduce((sum, lvl) => sum + (sectionConfigs[lvl]?.length ?? 2), 0)

  const summaryText = !selectedSchoolYearId
    ? "Select a school year to begin."
    : selectedPrograms.size === 0
    ? "Select at least one program."
    : [
        `${selectedPrograms.size} program(s)`,
        totalLevelCount > 0 && `${totalLevelCount} level(s)`,
        totalSectionCount > 0 && `${totalSectionCount} section(s)`,
        selectedPrograms.has("college") && `${Array.from(selectedCourses).length} course(s)`,
        selectedPrograms.has("shs")     && `${Array.from(selectedStrands).length} strand(s)`,
        `${allSelectableSubjects.filter((s) => selectedSubjects.has(s)).length} subject(s)`,
        seedGradingScale && `${Object.keys(resolvedGradingScales).length} grading scale(s)`,
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
          {collapsed
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown  className="h-4 w-4 text-muted-foreground" />}
        </button>

        {!collapsed && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-sm text-muted-foreground -mt-1">
              Seed your organization with programs, levels, subjects, and grading scales.
              Safe to run multiple times — only adds missing data.
            </p>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                School Year
                <span className="text-destructive ml-0.5">*</span>
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

            <div className={cn(
              "space-y-5 transition-opacity",
              !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : "",
            )}>
              <ProgramStep {...{
                selectedPrograms,
                onToggleProgram:       helpers.toggleProgram,
                onSelectAllPrograms:   helpers.selectAllPrograms,
                onDeselectAllPrograms: helpers.deselectAllPrograms,
              }} />

              {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
                <LevelStep
                  selectedPrograms={selectedPrograms}
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
                <StrandStep {...{
                  selectedStrands,
                  onToggleStrand:        helpers.toggleStrand,
                  onSelectAllStrands:    helpers.selectAllStrands,
                  onDeselectAllStrands:  helpers.deselectAllStrands,
                }} />
              )}

              {selectedPrograms.has("college") && (
                <CourseStep {...{
                  selectedCourses,
                  onToggleCourse:        helpers.toggleCourse,
                  onSelectAllCourses:    helpers.selectAllCourses,
                  onDeselectAllCourses:  helpers.deselectAllCourses,
                }} />
              )}

              <SubjectStep
                selectedPrograms={selectedPrograms}
                selectedLevels={derivedSelectedLevels}
                selectedStrands={selectedStrands}
                selectedCourses={selectedCourses}
                selectedSubjects={selectedSubjects}
                onToggleSubject={helpers.toggleSubject}
                onSelectAllForGroup={helpers.selectAllForGroup}
                onDeselectAllForGroup={helpers.deselectAllForGroup}
                allSelectableSubjects={allSelectableSubjects}
              />

              {selectedPrograms.size > 0 && (
                <div className="border-t pt-5">
                  <GradingScaleStep
                    selectedPrograms={selectedPrograms}
                    seedGradingScale={seedGradingScale}
                    gradingScaleByProgram={gradingScaleByProgram}
                    onToggleSeed={setSeedGradingScale}
                    onSelectPreset={setGradingScaleForProgram}
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
                  !selectedSchoolYearId  ||
                  selectedPrograms.size === 0
                }
              >
                {seedMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
                ) : (
                  <><Database className="mr-2 h-4 w-4" /> Apply Seed</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Short-duration warning — sits outside the card to avoid nesting issues */}
      <ConfirmDialog
        open={!!pendingSchoolYear}
        title="School year looks short"
        message="This school year doesn't span a full year. This might be a mistake — are you sure you want to proceed?"
        confirmLabel="Yes, create it"
        destructive={false}
        isLoading={createSchoolYearMutation.isPending}
        onConfirm={handleConfirmShortDuration}
        onOpenChange={(o) => { if (!o) setPendingSchoolYear(null) }}
      />
    </>
  )
}
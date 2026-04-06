import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { organizationApi } from "@/api/admin/organization.api"
import { schoolYearApi } from "@/api/admin/school-year.api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
} from "lucide-react"

import { SchoolYearStep } from "./SchoolYearStep"
import { ProgramStep }    from "./ProgramStep"
import { LevelStep }      from "./LevelStep"
import { StrandStep }     from "./StrandStep"
import { CourseStep }     from "./CourseStep"
import { SubjectStep }    from "./SubjectStep"
import { useSeedState }   from "./hooks/useSeedState"
import { COLLEGE_COURSES, LEVEL_DEFS, PROGRAMS, SHS_STRANDS } from "./constants/seed-data"

export function SeederCard() {
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)

  // ── School year ──────────────────────────────────────────────────────────
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
    mutationFn: (name: string) => schoolYearApi.create({ name }),
    onSuccess:  (created) => {
      toast.success(`School year "${created.name}" created.`)
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] })
      setSelectedSchoolYearId(created.id)
    },
    onError: () => toast.error("Failed to create school year."),
  })

  // ── Seed state ───────────────────────────────────────────────────────────
  const {
    selectedPrograms,  setSelectedPrograms,
    selectedCourses,   setSelectedCourses,
    selectedStrands,   setSelectedStrands,
    selectedLevels,    setSelectedLevels,
    selectedSubjects,  setSelectedSubjects,
    allSelectableSubjects,
    toggleSet,
    selectAll,
    deselectAll,
  } = useSeedState()

  // ── Seed mutation ─────────────────────────────────────────────────────────
  const seedMutation = useMutation({
    mutationFn: organizationApi.seedOrg,
    onSuccess:  () => {
      toast.success("Seed completed! Your programs, levels, and subjects are ready.")
      setCollapsed(true)
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

    const allLevels = Object.entries(LEVEL_DEFS)
      .filter(([prog]) => selectedPrograms.has(prog))
      .flatMap(([, levels]) => levels)

    const excludedLevels   = allLevels.filter((l) => !selectedLevels.has(l))
    const excludedSubjects = allSelectableSubjects.filter((s) => !selectedSubjects.has(s))

    seedMutation.mutate({
      schoolYearId:     selectedSchoolYearId,
      programs:         Array.from(selectedPrograms),
      courses:          selectedPrograms.has("college") ? Array.from(selectedCourses)  : undefined,
      strands:          selectedPrograms.has("shs")     ? Array.from(selectedStrands)  : undefined,
      excludedLevels:   excludedLevels.length   > 0     ? excludedLevels               : undefined,
      excludedSubjects: excludedSubjects.length > 0     ? excludedSubjects             : undefined,
    })
  }

  // ── Helpers wired to useSeedState ─────────────────────────────────────────
  const helpers = {
    toggleProgram:         (key: string)    => toggleSet(selectedPrograms, key, setSelectedPrograms),
    selectAllPrograms:     ()               => selectAll(PROGRAMS.map((p) => p.key), setSelectedPrograms),
    deselectAllPrograms:   ()               => deselectAll(setSelectedPrograms),

    toggleLevel:           (lvl: string)    => toggleSet(selectedLevels, lvl, setSelectedLevels),
    selectAllForProgram:   (lvls: string[]) => selectAll([...Array.from(selectedLevels), ...lvls], setSelectedLevels),
    deselectAllForProgram: (lvls: string[]) => {
      const next = new Set(selectedLevels)
      lvls.forEach((l) => next.delete(l))
      setSelectedLevels(next)
    },

    toggleStrand:          (s: string)      => toggleSet(selectedStrands, s, setSelectedStrands),
    selectAllStrands:      ()               => selectAll(SHS_STRANDS, setSelectedStrands),
    deselectAllStrands:    ()               => deselectAll(setSelectedStrands),

    toggleCourse:          (c: string)      => toggleSet(selectedCourses, c, setSelectedCourses),
    selectAllCourses:      ()               => selectAll(COLLEGE_COURSES.map((c) => c.code), setSelectedCourses),
    deselectAllCourses:    ()               => deselectAll(setSelectedCourses),

    toggleSubject:         (s: string)      => toggleSet(selectedSubjects, s, setSelectedSubjects),
    selectAllForGroup:     (subs: string[]) => {
      const n = new Set(selectedSubjects); subs.forEach((s) => n.add(s)); setSelectedSubjects(n)
    },
    deselectAllForGroup:   (subs: string[]) => {
      const n = new Set(selectedSubjects); subs.forEach((s) => n.delete(s)); setSelectedSubjects(n)
    },
  }

  // ── Summary line for footer ───────────────────────────────────────────────
  const summaryText = !selectedSchoolYearId
    ? "Select a school year to begin."
    : selectedPrograms.size === 0
    ? "Select at least one program."
    : [
        `${selectedPrograms.size} program(s)`,
        selectedPrograms.has("college") && `${Array.from(selectedCourses).length} course(s)`,
        selectedPrograms.has("shs")     && `${Array.from(selectedStrands).length} strand(s)`,
        `${allSelectableSubjects.filter((s) => selectedSubjects.has(s)).length} subject(s) selected`,
      ]
        .filter(Boolean)
        .join(" · ")

  return (
    <div className="rounded-lg border bg-card">
      {/* ── Card header (always visible) ── */}
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
          : <ChevronDown  className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {/* ── Collapsible body ── */}
      {!collapsed && (
        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-muted-foreground -mt-1">
            Seed your organization with programs, levels, sections, subjects, and grading schemes.
            Safe to run multiple times — only adds missing data.
          </p>

          {/* School Year */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              School Year
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              All seeded data will be scoped to the selected school year.
            </p>
            <SchoolYearStep
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
              onCreate={(name) => createSchoolYearMutation.mutate(name)}
              isCreating={createSchoolYearMutation.isPending}
            />
            {!selectedSchoolYearId && !syLoading && (
              <p className="text-xs text-destructive">
                A school year is required before seeding.
              </p>
            )}
          </div>

          {/* Steps — dimmed until school year selected */}
          <div className={cn(
            "space-y-5 transition-opacity",
            !selectedSchoolYearId ? "opacity-40 pointer-events-none select-none" : ""
          )}>
            <ProgramStep
              selectedPrograms={selectedPrograms}
              onToggleProgram={helpers.toggleProgram}
              onSelectAllPrograms={helpers.selectAllPrograms}
              onDeselectAllPrograms={helpers.deselectAllPrograms}
            />

            {Array.from(selectedPrograms).some((p) => LEVEL_DEFS[p]) && (
              <LevelStep
                selectedPrograms={selectedPrograms}
                selectedLevels={selectedLevels}
                onToggleLevel={helpers.toggleLevel}
                onSelectAllForProgram={helpers.selectAllForProgram}
                onDeselectAllForProgram={helpers.deselectAllForProgram}
              />
            )}

            {selectedPrograms.has("shs") && (
              <StrandStep
                selectedStrands={selectedStrands}
                onToggleStrand={helpers.toggleStrand}
                onSelectAllStrands={helpers.selectAllStrands}
                onDeselectAllStrands={helpers.deselectAllStrands}
              />
            )}

            {selectedPrograms.has("college") && (
              <CourseStep
                selectedCourses={selectedCourses}
                onToggleCourse={helpers.toggleCourse}
                onSelectAllCourses={helpers.selectAllCourses}
                onDeselectAllCourses={helpers.deselectAllCourses}
              />
            )}

            <SubjectStep
              selectedPrograms={selectedPrograms}
              selectedLevels={selectedLevels}
              selectedStrands={selectedStrands}
              selectedCourses={selectedCourses}
              selectedSubjects={selectedSubjects}
              onToggleSubject={helpers.toggleSubject}
              onSelectAllForGroup={helpers.selectAllForGroup}
              onDeselectAllForGroup={helpers.deselectAllForGroup}
              allSelectableSubjects={allSelectableSubjects}
            />
          </div>

          {/* Footer */}
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Apply Seed</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
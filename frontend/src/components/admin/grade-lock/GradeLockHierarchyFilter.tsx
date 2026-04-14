"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { programApi } from "@/api/admin/program.api"
import { courseApi } from "@/api/admin/course.api"
import { strandApi } from "@/api/admin/strand.api"
import { levelApi } from "@/api/admin/level.api"

import type { SchoolYear } from "@/types/admin/school-year.types"
import type { GradeLock } from "@/types/admin/grade-lock.types"
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector"

interface GradeLockHierarchyFilterProps {
  schoolYears: SchoolYear[]
  schoolYearsLoading: boolean
  gradeLocks: GradeLock[]
  gradeLockLoading: boolean

  selectedSchoolYearId: string
  selectedProgram: string
  selectedCourseStrand: string
  selectedLevel: string

  filteredCount: number

  onSchoolYearSelect: (id: string | null) => void
  onProgramChange: (value: string) => void
  onCourseStrandChange: (value: string) => void
  onLevelChange: (value: string) => void
  onReset: () => void
}

export function GradeLockHierarchyFilter({
  schoolYears,
  schoolYearsLoading,
  gradeLocks,
  gradeLockLoading,
  selectedSchoolYearId,
  selectedProgram,
  selectedCourseStrand,
  selectedLevel,
  filteredCount,
  onSchoolYearSelect,
  onProgramChange,
  onCourseStrandChange,
  onLevelChange,
  onReset,
}: GradeLockHierarchyFilterProps): React.JSX.Element {

  // ─────────────────────────────────────────
  // PROGRAMS (NOW API-DRIVEN)
  // ─────────────────────────────────────────
  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs", selectedSchoolYearId],
    queryFn: () => programApi.getAll(selectedSchoolYearId),
    enabled: !!selectedSchoolYearId,
  })

  const selectedProgramObj = programs.find((p) => p.id === selectedProgram)
  const programType = selectedProgramObj?.type

  // ─────────────────────────────────────────
  // COURSES
  // ─────────────────────────────────────────
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses", selectedSchoolYearId, selectedProgram],
    queryFn: () =>
      courseApi.getAll({
        schoolYearId: selectedSchoolYearId,
        programId: selectedProgram,
      }),
    enabled: !!selectedSchoolYearId && !!selectedProgram && programType === "college",
  })

  // ─────────────────────────────────────────
  // STRANDS
  // ─────────────────────────────────────────
  const { data: strands = [], isLoading: loadingStrands } = useQuery({
    queryKey: ["strands", selectedProgram],
    queryFn: () => strandApi.getAll({ program_id: selectedProgram }),
    enabled: !!selectedProgram && programType === "shs",
  })

  // ─────────────────────────────────────────
  // LEVELS
  // ─────────────────────────────────────────
  const levelsEnabled =
    !!selectedSchoolYearId &&
    !!selectedProgram &&
    (
      (programType === "college" && !!selectedCourseStrand) ||
      (programType === "shs" && !!selectedCourseStrand) ||
      (!programType)
    )

  const { data: levels = [], isLoading: loadingLevels } = useQuery({
    queryKey: ["levels", selectedSchoolYearId, selectedProgram],
    queryFn: () => levelApi.getBySchoolYear(selectedSchoolYearId),
    enabled: levelsEnabled,
    select: (all) => all.filter((l) => l.program_id === selectedProgram),
  })

  // ─────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────
  const hasFilters =
    !!selectedSchoolYearId ||
    !!selectedProgram ||
    !!selectedCourseStrand ||
    !!selectedLevel

  const hasCourseStrand =
    programType === "college" || programType === "shs"

  const levelStepReady =
    selectedProgram &&
    (!hasCourseStrand || selectedCourseStrand)

  if (schoolYearsLoading || gradeLockLoading) {
    return <Skeleton className="h-10 w-full" />
  }

  return (
    <div className="space-y-4">

      <div className="flex flex-wrap gap-3 items-center">

        {/* ─── School Year ───────────────────────── */}
        <SchoolYearSelector
          schoolYears={schoolYears ?? []}
          isLoading={schoolYearsLoading}
          selectedId={selectedSchoolYearId}
          onSelect={(id) => {
            onSchoolYearSelect(id)
            onProgramChange("")
            onCourseStrandChange("")
            onLevelChange("")
          }}
        />

        {/* ─── Program ───────────────────────────── */}
        {selectedSchoolYearId && (
          loadingPrograms ? (
            <Skeleton className="h-9 w-44" />
          ) : (
            <Select
              value={selectedProgram}
              onValueChange={(val) => {
                onProgramChange(val)
                onCourseStrandChange("")
                onLevelChange("")
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* ─── Course / Strand ───────────────────── */}
        {selectedProgram && programType === "college" && (
          loadingCourses ? (
            <Skeleton className="h-9 w-44" />
          ) : (
            <Select
              value={selectedCourseStrand}
              onValueChange={(val) => {
                onCourseStrandChange(val)
                onLevelChange("")
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {selectedProgram && programType === "shs" && (
          loadingStrands ? (
            <Skeleton className="h-44" />
          ) : (
            <Select
              value={selectedCourseStrand}
              onValueChange={(val) => {
                onCourseStrandChange(val)
                onLevelChange("")
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select Strand" />
              </SelectTrigger>
              <SelectContent>
                {strands.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {/* ─── Level ─────────────────────────────── */}
        {levelStepReady && (
          loadingLevels ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <Select
              value={selectedLevel}
              onValueChange={onLevelChange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}

        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredCount} class{filteredCount !== 1 ? "es" : ""}
      </div>
    </div>
  )
}
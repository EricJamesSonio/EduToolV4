"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { SchoolYear } from "@/types/admin/school-year.types"
import type { GradeLock } from "@/types/admin/grade-lock.types"

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
  const programs = useMemo(() => {
    if (!selectedSchoolYearId) return []
    return Array.from(
      new Set(
        gradeLocks
          .filter((lock) => lock.class?.school_year_id === selectedSchoolYearId)
          .map((lock) => lock.class?.subject?.program?.name)
          .filter((name): name is string => Boolean(name))
      )
    )
  }, [selectedSchoolYearId, gradeLocks])

  const coursesStrands = useMemo(() => {
    if (!selectedProgram) return []
    return Array.from(
      new Set(
        gradeLocks
          .filter(
            (lock) =>
              lock.class?.school_year_id === selectedSchoolYearId &&
              lock.class?.subject?.program?.name === selectedProgram
          )
          .map((lock) => {
            const course = lock.class?.subject?.course?.name
            const strand = lock.class?.subject?.strand?.name
            return course ?? strand
          })
          .filter((name): name is string => Boolean(name))
      )
    )
  }, [selectedProgram, selectedSchoolYearId, gradeLocks])

  const levels = useMemo(() => {
    if (!selectedProgram) return []
    return Array.from(
      new Set(
        gradeLocks
          .filter((lock) => {
            const subject = lock.class?.subject
            if (lock.class?.school_year_id !== selectedSchoolYearId) return false
            if (subject?.program?.name !== selectedProgram) return false
            if (coursesStrands.length > 0 && !selectedCourseStrand) return false
            if (
              selectedCourseStrand &&
              subject?.course?.name !== selectedCourseStrand &&
              subject?.strand?.name !== selectedCourseStrand
            )
              return false
            return true
          })
          .map((lock) => lock.class?.subject?.level?.name)
          .filter((name): name is string => Boolean(name))
      )
    )
  }, [selectedCourseStrand, selectedProgram, selectedSchoolYearId, gradeLocks, coursesStrands])

  const hasFilters =
    !!selectedSchoolYearId ||
    !!selectedProgram ||
    !!selectedCourseStrand ||
    !!selectedLevel

  // show course/strand step only if program has them
  const hasCourseStrand = coursesStrands.length > 0
  // show level step only after course/strand is resolved
  const levelStepReady = selectedProgram && (!hasCourseStrand || selectedCourseStrand)

  if (schoolYearsLoading || gradeLockLoading) {
    return <Skeleton className="h-10 w-full" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Step 1 — School Year: always visible */}
        <Select
          value={selectedSchoolYearId}
          onValueChange={(value) => onSchoolYearSelect(value || null)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select School Year" />
          </SelectTrigger>
          <SelectContent>
            {schoolYears?.map((sy) => (
              <SelectItem key={sy.id} value={sy.id}>
                {sy.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Step 2 — Program: visible after school year */}
        {selectedSchoolYearId && (
          <Select
            value={selectedProgram}
            onValueChange={onProgramChange}
            disabled={programs.length === 0}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((prog) => (
                <SelectItem key={prog} value={prog}>
                  {prog}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Step 3 — Course / Strand: visible only if program has them */}
        {selectedProgram && hasCourseStrand && (
          <Select
            value={selectedCourseStrand}
            onValueChange={onCourseStrandChange}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select Course / Strand" />
            </SelectTrigger>
            <SelectContent>
              {coursesStrands.map((cs) => (
                <SelectItem key={cs} value={cs}>
                  {cs}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Step 4 — Level: visible after course/strand resolved (or skipped if none) */}
        {levelStepReady && levels.length > 0 && (
          <Select value={selectedLevel} onValueChange={onLevelChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
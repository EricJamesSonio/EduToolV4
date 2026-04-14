// ===== File: frontend/src/components/admin/grade-lock/GradeLockHierarchyFilter.tsx =====

"use client"

import { useState, useMemo , useEffect} from "react"
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
  onFilter: (filtered: GradeLock[]) => void
  onSchoolYearSelect: (id: string | null) => void
}

export function GradeLockHierarchyFilter({
  schoolYears,
  schoolYearsLoading,
  gradeLocks,
  gradeLockLoading,
  onFilter,
  onSchoolYearSelect,
}: GradeLockHierarchyFilterProps): React.JSX.Element {
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>("")
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [selectedCourseStrand, setSelectedCourseStrand] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  // Extract programs from selected school year
  const programs = useMemo(() => {
    if (!selectedSchoolYear) return []
    return Array.from(
      new Set(
        gradeLocks
          .filter((lock) => lock.class?.school_year_id === selectedSchoolYear)
          .map((lock) => lock.class?.subject?.program?.name)
          .filter(Boolean)
      )
    )
  }, [selectedSchoolYear, gradeLocks])

  // Extract courses/strands for selected program
  const coursesStrands = useMemo(() => {
    if (!selectedProgram) return []
    const items = gradeLocks
      .filter(
        (lock) =>
          lock.class?.school_year_id === selectedSchoolYear &&
          lock.class?.subject?.program?.name === selectedProgram
      )
      .map((lock) => {
        const course = lock.class?.subject?.course?.name
        const strand = lock.class?.subject?.strand?.name
        return {
          name: course || strand,
          type: course ? "course" : "strand",
        }
      })

    return Array.from(new Set(items.map((i) => i.name)))
  }, [selectedProgram, selectedSchoolYear, gradeLocks])

  // Extract levels for selected course/strand
  const levels = useMemo(() => {
    if (!selectedCourseStrand) return []
    return Array.from(
      new Set(
        gradeLocks
          .filter(
            (lock) =>
              lock.class?.school_year_id === selectedSchoolYear &&
              lock.class?.subject?.program?.name === selectedProgram &&
              (lock.class?.subject?.course?.name === selectedCourseStrand ||
                lock.class?.subject?.strand?.name === selectedCourseStrand)
          )
          .map((lock) => lock.class?.subject?.level?.name)
          .filter(Boolean)
      )
    )
  }, [selectedCourseStrand, selectedProgram, selectedSchoolYear, gradeLocks])

const filteredLocks = useMemo(() => {
  let result = gradeLocks

  if (selectedSchoolYear) {
    result = result.filter(
      (lock) => lock.class?.school_year_id === selectedSchoolYear
    )
  }
  if (selectedProgram) {
    result = result.filter(
      (lock) => lock.class?.subject?.program?.name === selectedProgram
    )
  }
  if (selectedCourseStrand) {
    result = result.filter(
      (lock) =>
        lock.class?.subject?.course?.name === selectedCourseStrand ||
        lock.class?.subject?.strand?.name === selectedCourseStrand
    )
  }
  if (selectedLevel) {
    result = result.filter(
      (lock) => lock.class?.subject?.level?.name === selectedLevel
    )
  }

  return result
}, [selectedSchoolYear, selectedProgram, selectedCourseStrand, selectedLevel, gradeLocks])

useEffect(() => {
  onFilter(filteredLocks)
}, [filteredLocks, onFilter])

  const handleReset = () => {
    setSelectedSchoolYear("")
    setSelectedProgram("")
    setSelectedCourseStrand("")
    setSelectedLevel("")
    onSchoolYearSelect(null)
    onFilter(gradeLocks)
  }

  if (schoolYearsLoading || gradeLockLoading) {
    return <Skeleton className="h-10 w-full" />
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* School Year */}
        <Select
          value={selectedSchoolYear}
          onValueChange={(value) => {
            setSelectedSchoolYear(value)
            setSelectedProgram("")
            setSelectedCourseStrand("")
            setSelectedLevel("")
            onSchoolYearSelect(value || null)
          }}
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

        {/* Program */}
        <Select
          value={selectedProgram}
          onValueChange={(value) => {
            setSelectedProgram(value)
            setSelectedCourseStrand("")
            setSelectedLevel("")
          }}
          disabled={!selectedSchoolYear || programs.length === 0}
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

        {/* Course / Strand */}
        <Select
          value={selectedCourseStrand}
          onValueChange={(value) => {
            setSelectedCourseStrand(value)
            setSelectedLevel("")
          }}
          disabled={!selectedProgram || coursesStrands.length === 0}
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

        {/* Level */}
        <Select
          value={selectedLevel}
          onValueChange={setSelectedLevel}
          disabled={!selectedCourseStrand || levels.length === 0}
        >
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

        {/* Reset Button */}
        {(selectedSchoolYear ||
          selectedProgram ||
          selectedCourseStrand ||
          selectedLevel) && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLocks.length} class
        {filteredLocks.length !== 1 ? "es" : ""}
      </div>
    </div>
  )
}
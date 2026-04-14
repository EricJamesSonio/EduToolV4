// ===== File: frontend/src/components/admin/grade-lock/GradeLockHierarchyFilter.tsx =====

"use client"

import { useState, useMemo } from "react"
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

  // Filter by school year
  const filteredLocks = useMemo(() => {
    if (!selectedSchoolYear) return gradeLocks

    return gradeLocks.filter(
      (lock) => lock.class?.school_year_id === selectedSchoolYear
    )
  }, [selectedSchoolYear, gradeLocks])

  const handleSchoolYearChange = (value: string) => {
    setSelectedSchoolYear(value)
    onSchoolYearSelect(value || null)
    onFilter(
      gradeLocks.filter((lock) => lock.class?.school_year_id === value)
    )
  }

  const handleReset = () => {
    setSelectedSchoolYear("")
    onSchoolYearSelect(null)
    onFilter(gradeLocks)
  }

  if (schoolYearsLoading || gradeLockLoading) {
    return <Skeleton className="h-10 w-48" />
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-3">
        {/* School Year */}
        <Select value={selectedSchoolYear} onValueChange={handleSchoolYearChange}>
          <SelectTrigger className="w-56">
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

        {/* Reset Button */}
        {selectedSchoolYear && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLocks.length} class
        {filteredLocks.length !== 1 ? "es" : ""}
        {selectedSchoolYear && ` in selected school year`}
      </div>
    </div>
  )
}
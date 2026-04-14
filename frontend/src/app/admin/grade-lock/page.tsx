"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Lock, Settings } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"

import { GradeLockHierarchyFilter } from "@/components/admin/grade-lock/GradeLockHierarchyFilter"
import { GradeLockSettingModal } from "@/components/admin/grade-lock/GradeLockSettingModal"
import { GradeLockOverrideDialog } from "@/components/admin/grade-lock/GradeLockOverrideDialog"
import { GradeLockStats } from "@/components/admin/grade-lock/GradeLockStats"

import { useGradeLockColumns } from "@/hooks/admin/useGradeLockColumns"
import {
  useGradeLocks,
  useGradeLockSettings,
} from "@/hooks/admin/useGradeLocks"

import { useSchoolYears } from "@/hooks/admin/useSchoolYears"

import type { GradeLock } from "@/types/admin/grade-lock.types"

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null)

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null)

  // ─── Filters ─────────────────────────────────────────────
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [selectedCourseStrand, setSelectedCourseStrand] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  // ─── Data ────────────────────────────────────────────────
  const { data: schoolYears, isLoading: schoolYearsLoading } = useSchoolYears()

  const { data: gradeLocks, isLoading } = useGradeLocks(
    selectedSchoolYearId ?? undefined
  )

  const { data: settings } = useGradeLockSettings()

  const columns = useGradeLockColumns(setOverrideTarget)

  // ─── Derived State ───────────────────────────────────────
  const locks = useMemo(
    () => (Array.isArray(gradeLocks) ? gradeLocks : []),
    [gradeLocks]
  )

  const activeSetting = useMemo(() => {
    return settings?.find((s) => s.is_default) ?? settings?.[0]
  }, [settings])

  const filteredLocks = useMemo(() => {
    let result = locks

    if (selectedSchoolYearId) {
      result = result.filter(
        (lock) => lock.class?.school_year_id === selectedSchoolYearId
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
  }, [
    locks,
    selectedSchoolYearId,
    selectedProgram,
    selectedCourseStrand,
    selectedLevel,
  ])

  // ─── Handlers ────────────────────────────────────────────
  const handleSchoolYearSelect = (id: string | null) => {
    setSelectedSchoolYearId(id)
    setSelectedProgram("")
    setSelectedCourseStrand("")
    setSelectedLevel("")
  }

  // ─── UI ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Grade Lock"
        description="Manage grade submission deadlines and lock status per class."
        actions={
          <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {activeSetting ? "Update Lock Window" : "Open Lock Window"}
          </Button>
        }
      />

      {/* Lock Deadline Display */}
      {activeSetting?.lock_deadline && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Lock deadline:</span>
          <span className="font-medium">
            {format(new Date(activeSetting.lock_deadline), "MMM d, yyyy h:mm a")}
          </span>
        </div>
      )}

      {/* Filters */}
      <GradeLockHierarchyFilter
        schoolYears={schoolYears ?? []}
        schoolYearsLoading={schoolYearsLoading}
        gradeLocks={locks}
        gradeLockLoading={isLoading}
        selectedSchoolYearId={selectedSchoolYearId ?? ""}
        selectedProgram={selectedProgram}
        selectedCourseStrand={selectedCourseStrand}
        selectedLevel={selectedLevel}
        filteredCount={filteredLocks.length}
        onSchoolYearSelect={handleSchoolYearSelect}
        onProgramChange={setSelectedProgram}
        onCourseStrandChange={(value) => {
          setSelectedCourseStrand(value)
          setSelectedLevel("")
        }}
        onLevelChange={setSelectedLevel}
        onReset={() => handleSchoolYearSelect(null)}
      />

      {/* Stats */}
      <GradeLockStats gradeLocks={filteredLocks} />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      {/* Setting Modal (UPDATED) */}
      <GradeLockSettingModal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        existingSetting={activeSetting}
      />

      {/* Override Dialog */}
      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />
    </div>
  )
}
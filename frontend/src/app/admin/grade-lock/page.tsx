"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { Lock, Settings, Layers } from "lucide-react"

import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"

import { GradeLockHierarchyFilter } from "@/components/admin/grade-lock/GradeLockHierarchyFilter"
import { GradeLockSettingModal } from "@/components/admin/grade-lock/GradeLockSettingModal"
import { GradeLockOverrideDialog } from "@/components/admin/grade-lock/GradeLockOverrideDialog"
import { GradeLockStats } from "@/components/admin/grade-lock/GradeLockStats"

import {
  useGradeLockColumns,
} from "@/hooks/admin/useGradeLockColumns"

import {
  useGradeLocks,
  useGradeLockSettings,
} from "@/hooks/admin/useGradeLocks"

import { useSchoolYears } from "@/hooks/admin/useSchoolYears"
import type { GradeLock } from "@/types/admin/grade-lock.types"

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null)

  // ─── SCHOOL YEAR SCOPING ─────────────────────────────
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  const [selectedCourseStrand, setSelectedCourseStrand] = useState<string>("")
  const [selectedLevel, setSelectedLevel] = useState<string>("")

  // ─── DATA ─────────────────────────────
  const { data: schoolYears, isLoading: schoolYearsLoading } = useSchoolYears()

  const { data: gradeLocks, isLoading } = useGradeLocks(
    selectedSchoolYearId ?? undefined
  )

  // GLOBAL templates (NEW IMPORTANT CHANGE)
  const { data: settings } = useGradeLockSettings()

  const columns = useGradeLockColumns(setOverrideTarget)

  // ─── SAFE NORMALIZATION ─────────────────────────────
  const locks = useMemo(
    () => (Array.isArray(gradeLocks) ? gradeLocks : []),
    [gradeLocks]
  )

  const templates = useMemo(
    () => (Array.isArray(settings) ? settings : []),
    [settings]
  )

  // ─── GLOBAL TEMPLATE (NOT SCHOOL YEAR SCOPED) ─────────
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.is_default) ?? templates[0] ?? null
  }, [templates])

  // ─── FILTERED CLASS LOCKS ─────────────────────────────
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

  const handleSchoolYearSelect = (id: string | null) => {
    setSelectedSchoolYearId(id)
    setSelectedProgram("")
    setSelectedCourseStrand("")
    setSelectedLevel("")
  }

  return (
    <div className="space-y-8 p-6">

      {/* ─────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────── */}
      <PageHeader
        title="Grade Lock System"
        description="Manage reusable lock templates and apply them to school years and classes."
        actions={
          <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Manage Templates
          </Button>
        }
      />

      {/* ─────────────────────────────────────────────
          GLOBAL TEMPLATES SECTION (NEW)
      ───────────────────────────────────────────── */}
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4" />
          Global Grade Lock Templates
        </div>

        {activeTemplate ? (
          <div className="text-sm text-muted-foreground">
            Active Template:{" "}
            <span className="font-medium text-foreground">
              {activeTemplate.name}
            </span>

            {activeTemplate.lock_deadline && (
              <span className="ml-2">
                (Deadline:{" "}
                {format(
                  new Date(activeTemplate.lock_deadline),
                  "MMM d, yyyy h:mm a"
                )}
                )
              </span>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No templates configured yet.
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          SCHOOL YEAR APPLICATION SECTION
      ───────────────────────────────────────────── */}

      {activeTemplate?.lock_deadline && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Global Rule:</span>
          <span className="font-medium">
            {format(
              new Date(activeTemplate.lock_deadline),
              "MMM d, yyyy h:mm a"
            )}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          FILTERS (APPLY TEMPLATE → CLASS SCOPE)
      ───────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────
          STATS
      ───────────────────────────────────────────── */}
      <GradeLockStats gradeLocks={filteredLocks} />

      {/* ─────────────────────────────────────────────
          TABLE
      ───────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      {/* ─────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────── */}
      <GradeLockSettingModal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        existingSetting={activeTemplate}
      />

      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />
    </div>
  )
}
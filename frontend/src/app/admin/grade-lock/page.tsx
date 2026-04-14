// ===== File: frontend/src/app/admin/grade-lock/page.tsx =====

"use client"

import { useState, useCallback } from "react"
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
import { useGradeLocks, useGradeLockSetting } from "@/hooks/admin/useGradeLocks"
import { useSchoolYears } from "@/hooks/admin/useSchoolYears"
import type { GradeLock } from "@/types/admin/grade-lock.types"

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null)
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null)
  const [filteredLocks, setFilteredLocks] = useState<GradeLock[]>([])

  const { data: schoolYears, isLoading: schoolYearsLoading } = useSchoolYears()
  const { data: gradeLocks, isLoading } = useGradeLocks(selectedSchoolYearId ?? undefined)
  const { data: setting } = useGradeLockSetting(selectedSchoolYearId ?? "")
  const columns = useGradeLockColumns(setOverrideTarget)

  const locks = Array.isArray(gradeLocks) ? gradeLocks : []

  // ✅ memoized handler
  const handleFilter = useCallback((filtered: GradeLock[]) => {
    setFilteredLocks(filtered)
  }, [])

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Grade Lock"
        description="Manage grade submission deadlines and lock status per class."
        actions={
          <Button onClick={() => setSettingModalOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            {setting ? "Update Lock Window" : "Open Lock Window"}
          </Button>
        }
      />

      {setting?.lock_deadline && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Lock deadline:</span>
          <span className="font-medium">
            {format(new Date(setting.lock_deadline), "MMM d, yyyy h:mm a")}
          </span>
        </div>
      )}

      {/* Hierarchical Filter */}
      <GradeLockHierarchyFilter
        schoolYears={schoolYears ?? []}
        schoolYearsLoading={schoolYearsLoading}
        gradeLocks={locks}
        gradeLockLoading={isLoading}
        onFilter={handleFilter} // ✅ replaced
        onSchoolYearSelect={setSelectedSchoolYearId}
      />

      <GradeLockStats gradeLocks={filteredLocks} />

      <DataTable
        columns={columns}
        data={filteredLocks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist. Try adjusting your filters."
      />

      <GradeLockSettingModal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        schoolYearId={selectedSchoolYearId ?? ""}
        existingDeadline={setting?.lock_deadline}
      />

      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />
    </div>
  )
}
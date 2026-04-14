// ===== File: frontend/src/app/admin/grade-lock/page.tsx =====

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Lock, Settings } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { GradeLockSettingModal } from "@/components/admin/grade-lock/GradeLockSettingModal"
import { GradeLockOverrideDialog } from "@/components/admin/grade-lock/GradeLockOverrideDialog"
import { GradeLockStats } from "@/components/admin/grade-lock/GradeLockStats"
import { useGradeLockColumns } from "@/hooks/admin/useGradeLockColumns"
import { useGradeLocks, useGradeLockSetting } from "@/hooks/admin/useGradeLocks"
import type { GradeLock } from "@/types/admin/grade-lock.types"

const ACTIVE_SCHOOL_YEAR_ID = "active-school-year-id"
const ACTIVE_SCHOOL_YEAR_LABEL = "S.Y. 2024–2025"

export default function GradeLockPage(): React.ReactElement {
  const [settingModalOpen, setSettingModalOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null)

  const { data: gradeLocks, isLoading } = useGradeLocks()
  const { data: setting } = useGradeLockSetting(ACTIVE_SCHOOL_YEAR_ID)
  const columns = useGradeLockColumns(setOverrideTarget)

  const locks = Array.isArray(gradeLocks) ? gradeLocks : []

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Active School Year</span>
          <span className="font-medium">{ACTIVE_SCHOOL_YEAR_LABEL}</span>
        </div>

        {setting?.lock_deadline && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Lock deadline:</span>
            <span className="font-medium">
              {format(new Date(setting.lock_deadline), "MMM d, yyyy h:mm a")}
            </span>
          </div>
        )}
      </div>

      <GradeLockStats gradeLocks={locks} />

      <DataTable
        columns={columns}
        data={locks}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist yet. Open a lock window to get started."
      />

      <GradeLockSettingModal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        schoolYearId={ACTIVE_SCHOOL_YEAR_ID}
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
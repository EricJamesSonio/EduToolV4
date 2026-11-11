"use client"

import { Layers, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { ICON_TONES } from "@/lib/palette"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { PROGRAM_TYPE_LABELS, type ProgramType } from "@/types/admin/program.types"
import { useSchoolProfileDepartmentTypes } from "@/hooks/admin/useSchoolProfileDepartmentTypes"

export function RegistrarSchoolProfileView(): React.JSX.Element {
  const { data: departments = [], isLoading } = useSchoolProfileDepartmentTypes()

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Profile"
        description="Departments this school offers. Only an administrator can change them."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={School}
          title="No departments configured yet"
          description="An administrator has not set up the school profile yet."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <div
              key={department.type}
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
            >
              <div className={cn("icon-container shrink-0", ICON_TONES.blue)}>
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium not-interactive">
                {PROGRAM_TYPE_LABELS[department.type as ProgramType] ?? department.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
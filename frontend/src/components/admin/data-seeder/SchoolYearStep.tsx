// frontend/src/components/admin/data-seeder/SchoolYearStep.tsx
"use client";

import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { Badge }    from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn }       from "@/lib/utils"
import { useOrganizationGuard } from "@/context/OrganizationGuardContext"
import { CreateSchoolYearDialog } from "@/components/admin/school-years/CreateSchoolYearDialog"
import type { SchoolYear } from "@/types/admin/school-year.types"

interface SchoolYearStepProps {
  schoolYears: SchoolYear[]
  isLoading:   boolean
  selectedId:  string | null
  onSelect:    (id: string) => void
}

export function SchoolYearStep({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
}: SchoolYearStepProps) {
  const { ensureOrganization } = useOrganizationGuard()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          {schoolYears.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {schoolYears.map((sy) => (
                <button
                  key={sy.id}
                  type="button"
                  onClick={() => onSelect(sy.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    selectedId === sy.id && "border-primary bg-primary/5",
                  )}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-medium block truncate">{sy.name}</span>
                    {(sy.start_date || sy.end_date) && (
                      <span className="text-xs text-muted-foreground block">
                        {sy.start_date ? new Date(sy.start_date).toLocaleDateString() : "—"}
                        {" – "}
                        {sy.end_date ? new Date(sy.end_date).toLocaleDateString() : "—"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge
                      variant={
                        sy.status === "active" ? "default"
                        : sy.status === "ended" ? "secondary"
                        : "outline"
                      }
                      className="text-xs capitalize"
                    >
                      {sy.status}
                    </Badge>
                    {selectedId === sy.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {schoolYears.length === 0 && (
            <p className="text-sm text-muted-foreground not-interactive">
              No school years found. Create one below to proceed.
            </p>
          )}

          <button
            type="button"
            onClick={() => ensureOrganization(() => setShowCreate(true))}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Create new school year
          </button>
        </>
      )}

      <CreateSchoolYearDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(schoolYear) => onSelect(schoolYear.id)}
      />
    </div>
  )
}
// frontend/src/components/admin/data-seeder/SchoolYearStep.tsx

import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { Badge }    from "@/components/ui/badge"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn }       from "@/lib/utils"
import type { SchoolYear } from "@/types/admin/school-year.types"

interface SchoolYearStepProps {
  schoolYears: SchoolYear[]
  isLoading:   boolean
  selectedId:  string | null
  onSelect:    (id: string) => void
  onCreate:    (name: string, startDate?: string, endDate?: string) => void
  isCreating:  boolean
}

export function SchoolYearStep({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
  onCreate,
  isCreating,
}: SchoolYearStepProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newName,    setNewName]    = useState("")
  const [startDate,  setStartDate]  = useState("")
  const [endDate,    setEndDate]    = useState("")
  const [errors,     setErrors]     = useState<{ name?: string; startDate?: string; endDate?: string }>({})

  function validate(): boolean {
    const e: typeof errors = {}
    if (!newName.trim())  e.name      = "Title is required"
    if (!startDate)       e.startDate = "Start date is required"
    if (!endDate)         e.endDate   = "End date is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    onCreate(newName.trim(), startDate, endDate)
    setNewName("")
    setStartDate("")
    setEndDate("")
    setShowCreate(false)
    setErrors({})
  }

  function handleCancel() {
    setShowCreate(false)
    setNewName("")
    setStartDate("")
    setEndDate("")
    setErrors({})
  }

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

          {schoolYears.length === 0 && !showCreate && (
            <p className="text-sm text-muted-foreground">
              No school years found. Create one below to proceed.
            </p>
          )}

          {showCreate ? (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs">School Year Title</Label>
                <Input
                  autoFocus
                  placeholder="e.g. S.Y. 2025–2026"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value)
                      if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }))
                    }}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }))
                    }}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim()}
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new school year
            </button>
          )}
        </>
      )}
    </div>
  )
}

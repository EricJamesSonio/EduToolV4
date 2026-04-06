import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { SchoolYear } from "@/types/admin/school-year.types"

interface SchoolYearStepProps {
  schoolYears: SchoolYear[]
  isLoading:   boolean
  selectedId:  string | null
  onSelect:    (id: string) => void
  onCreate:    (name: string) => void
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
  const [newName, setNewName]       = useState("")

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setNewName("")
    setShowCreate(false)
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
                    selectedId === sy.id && "border-primary bg-primary/5"
                  )}
                >
                  <span className="font-medium">{sy.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        sy.status === "active"  ? "default"   :
                        sy.status === "ended"   ? "secondary" : "outline"
                      }
                      className="text-xs capitalize"
                    >
                      {sy.status}
                    </Badge>
                    {selectedId === sy.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
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
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="e.g. S.Y. 2025–2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setShowCreate(false); setNewName("") }}
              >
                Cancel
              </Button>
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
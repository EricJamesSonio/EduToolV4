"use client"

import { BookOpen } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { SchoolProfileStrand } from "@/types/admin/school-profile.types"

interface StrandStepProps {
  departmentId: string
  strands: SchoolProfileStrand[]
  onAdd: (departmentId: string, name: string) => void
  onRename: (strandId: string, name: string) => void
  onDelete: (strandId: string) => void
  disabled?: boolean
}

export function StrandStep({
  departmentId,
  strands,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: StrandStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium not-interactive">Strands</p>
      </div>

      {strands.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">
          No strands yet — add the ones your school actually offers.
        </p>
      )}

      <div className="space-y-2">
        {strands.map((strand) => (
          <EditableItemRow
            key={strand.id}
            label={strand.name}
            disabled={disabled}
            onRename={(name) => onRename(strand.id, name)}
            onDelete={() => onDelete(strand.id)}
          />
        ))}
      </div>

      <AddItemInput
        placeholder="e.g. STEM"
        disabled={disabled}
        onAdd={(name) => onAdd(departmentId, name)}
      />
    </div>
  )
}
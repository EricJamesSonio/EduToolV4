"use client"

import { BookOpen } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { DraftStrand } from "@/hooks/admin/useSchoolProfileDraft"

interface StrandStepProps {
  departmentId: string
  strands: DraftStrand[]
  onAdd: (departmentId: string, name: string) => void
  onRename: (strandKey: string, name: string) => void
  onDelete: (strandKey: string) => void
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
            key={strand.key}
            label={strand.name}
            disabled={disabled}
            onRename={(name) => onRename(strand.key, name)}
            onDelete={() => onDelete(strand.key)}
          />
        ))}
      </div>

      {!disabled && (
        <AddItemInput
          placeholder="e.g. STEM"
          disabled={disabled}
          onAdd={(name) => onAdd(departmentId, name)}
        />
      )}
    </div>
  )
}
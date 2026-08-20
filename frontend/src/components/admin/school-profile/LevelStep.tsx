"use client"

import { LayoutList } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { DraftLevel } from "@/hooks/admin/useSchoolProfileDraft"

interface LevelStepProps {
  parentId: string
  groupLabel: string
  levels: DraftLevel[]
  onAdd: (parentId: string, name: string) => void
  onRename: (levelKey: string, name: string) => void
  onDelete: (levelKey: string) => void
  disabled?: boolean
}

export function LevelStep({
  parentId,
  groupLabel,
  levels,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: LevelStepProps) {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <LayoutList className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground not-interactive">{groupLabel}</p>
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">No levels yet.</p>
      )}

      <div className="space-y-1.5">
        {sorted.map((level) => (
          <EditableItemRow
            key={level.key}
            label={level.name}
            disabled={disabled}
            onRename={(name) => onRename(level.key, name)}
            onDelete={() => onDelete(level.key)}
          />
        ))}
      </div>

      <AddItemInput
        placeholder="e.g. Grade 11"
        disabled={disabled}
        onAdd={(name) => onAdd(parentId, name)}
      />
    </div>
  )
}
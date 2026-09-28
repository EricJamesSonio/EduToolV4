"use client"

import { useState } from "react"
import { LayoutList, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LevelNumberStepper } from "@/components/admin/levels/LevelNumberStepper"
import { getLevelLabel, extractLevelNumber } from "@/lib/level-label"
import type { ProgramType } from "@/types/admin/program.types"
import type { DraftLevel } from "@/hooks/admin/useSchoolProfileDraft"

interface LevelStepProps {
  parentId: string
  groupLabel: string
  programType: ProgramType
  levels: DraftLevel[]
  onAdd: (parentId: string, name: string) => void
  onRename: (levelKey: string, name: string) => void
  onDelete: (levelKey: string) => void
  disabled?: boolean
}

export function LevelStep({
  parentId,
  groupLabel,
  programType,
  levels,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: LevelStepProps) {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const handleAddNext = () => {
    const nextCount = sorted.length + 1
    onAdd(parentId, getLevelLabel(programType, nextCount))
  }

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
          <div
            key={level.key}
            className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2"
          >
            {editingKey === level.key ? (
              <LevelNumberStepper
                programType={programType}
                initialValue={extractLevelNumber(programType, level.name)}
                onSave={(n) => {
                  onRename(level.key, getLevelLabel(programType, n))
                  setEditingKey(null)
                }}
                onCancel={() => setEditingKey(null)}
              />
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium not-interactive">{level.name}</p>
                </div>
                {!disabled && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditingKey(level.key)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(level.key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={handleAddNext}
        >
          <Plus className="h-3.5 w-3.5" />
          Add {getLevelLabel(programType, sorted.length + 1)}
        </Button>
      )}
    </div>
  )
}
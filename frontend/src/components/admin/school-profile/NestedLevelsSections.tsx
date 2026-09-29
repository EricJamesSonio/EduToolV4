"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LevelNumberStepper } from "@/components/admin/levels/LevelNumberStepper"
import { getLevelLabel, extractLevelNumber } from "@/lib/level-label"
import type { ProgramType } from "@/types/admin/program.types"
import { SectionStep } from "./SectionStep"
import { LevelPillLabel } from "./ui/ProfileCard"
import type { DraftDepartment, DraftLevel, useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"

interface NestedLevelsSectionsProps {
  department: DraftDepartment
  levels: DraftLevel[]
  groupLabel: string | null
  /** Key of the course/strand/department these levels belong to — used when adding. */
  parentKey: string
  programType: ProgramType
  expandedLevelKey: string | null
  onToggleLevel: (key: string) => void
  readOnly: boolean
  saving: boolean
  draft: ReturnType<typeof useSchoolProfileDraft>
}

export function NestedLevelsSections({
  department,
  levels,
  groupLabel,
  parentKey,
  programType,
  expandedLevelKey,
  onToggleLevel,
  readOnly,
  saving,
  draft,
}: NestedLevelsSectionsProps) {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const disabled = readOnly || saving

  const handleAddNext = () => {
    draft.addLevel(department.type, parentKey, getLevelLabel(programType, sorted.length + 1))
  }

  if (sorted.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
          {groupLabel
            ? `No levels in ${groupLabel} yet.`
            : "No levels yet."}
        </p>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={handleAddNext}
          >
            <Plus className="h-3.5 w-3.5" />
            Add {getLevelLabel(programType, 1)}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((level) => {
        const expanded = level.key === expandedLevelKey
        const editing = editingKey === level.key
        return (
          <div key={level.key} className="rounded-lg border bg-background overflow-hidden">
            <div className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <button
                type="button"
                onClick={() => onToggleLevel(level.key)}
                aria-expanded={expanded}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                {editing ? (
                  <span className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                    <LevelNumberStepper
                      programType={programType}
                      initialValue={extractLevelNumber(programType, level.name)}
                      onSave={(n) => {
                        draft.renameLevel(department.type, level.key, getLevelLabel(programType, n))
                        setEditingKey(null)
                      }}
                      onCancel={() => setEditingKey(null)}
                    />
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    <LevelPillLabel level={level} />
                  </span>
                )}
              </button>
              {!disabled && !editing && (
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
                    onClick={() => draft.deleteLevel(department.type, level.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {expanded && !editing && (
              <div className="ml-5 border-l-2 border-muted pl-3 pr-3 pb-3">
                <SectionStep
                  levelId={level.key}
                  levelLabel={`${level.name} — Sections`}
                  sections={level.sections}
                  hideHeader
                  disabled={disabled}
                  onAdd={(_levelKey, name, capacity) => draft.addSection(department.type, level.key, name, capacity)}
                  onUpdate={(sectionKey, name, capacity) =>
                    draft.updateSection(department.type, level.key, sectionKey, name, capacity)
                  }
                  onDelete={(sectionKey) => draft.deleteSection(department.type, level.key, sectionKey)}
                />
              </div>
            )}
          </div>
        )
      })}

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

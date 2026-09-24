"use client"

import { Layers } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import { Button } from "@/components/ui/button"
import type { DraftSubject } from "@/hooks/admin/useSchoolProfileDraft"

interface LevelOption {
  key: string
  label: string
}

interface SharedSubjectStepProps {
  subjects: DraftSubject[]
  levelOptions: LevelOption[]
  onAdd: (name: string) => void
  onRename: (subjectKey: string, name: string) => void
  onDelete: (subjectKey: string) => void
  onPromote: (subjectKey: string, levelKey: string) => void
  disabled?: boolean
}

/**
 * Department-level shared (minor) subjects. The seeder reads these from
 * profile.subjects rather than from level.subjects, so they live here.
 * Promoting one hands it to a specific level as a major.
 */
export function SharedSubjectStep({
  subjects,
  levelOptions,
  onAdd,
  onRename,
  onDelete,
  onPromote,
  disabled = false,
}: SharedSubjectStepProps) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground not-interactive">
          Shared / minor subjects
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground not-interactive">
        Shared across this department&apos;s courses/strands. Promote one to make
        it a major on a specific level.
      </p>

      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">
          No shared subjects yet.
        </p>
      )}

      <div className="space-y-1.5">
        {subjects.map((subject) => (
          <div key={subject.key} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <EditableItemRow
                label={subject.name}
                disabled={disabled}
                onRename={(name) => onRename(subject.key, name)}
                onDelete={() => onDelete(subject.key)}
              />
            </div>
            {!disabled && levelOptions.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 px-2 text-[10px]"
                onClick={() => onPromote(subject.key, levelOptions[0].key)}
                title={`Move to ${levelOptions[0].label} as a major subject`}
              >
                Make major
              </Button>
            )}
          </div>
        ))}
      </div>

      {levelOptions.length > 0 && (
        <p className="text-[10px] text-muted-foreground not-interactive">
          Default target level: {levelOptions[0].label}
        </p>
      )}

      {!disabled && (
        <AddItemInput
          placeholder="e.g. General Education"
          disabled={disabled}
          onAdd={onAdd}
        />
      )}
    </div>
  )
}
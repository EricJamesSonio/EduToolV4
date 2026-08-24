"use client"

import { BookOpen } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { DraftSubject } from "@/hooks/admin/useSchoolProfileDraft"

interface SubjectStepProps {
  levelId: string
  levelLabel: string
  subjects: DraftSubject[]
  onAdd: (levelId: string, name: string) => void
  onRename: (subjectKey: string, name: string) => void
  onDelete: (subjectKey: string) => void
  disabled?: boolean
}

export function SubjectStep({
  levelId,
  levelLabel,
  subjects,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: SubjectStepProps) {
  const majors = subjects.filter((s) => s.subjectType === "major")

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground not-interactive">{levelLabel}</p>
      </div>

      {majors.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">No subjects yet.</p>
      )}

      <div className="space-y-1.5">
        {majors.map((subject) => (
          <EditableItemRow
            key={subject.key}
            label={subject.name}
            disabled={disabled}
            onRename={(name) => onRename(subject.key, name)}
            onDelete={() => onDelete(subject.key)}
          />
        ))}
      </div>

      {!disabled && (
        <AddItemInput
          placeholder="e.g. Mathematics"
          disabled={disabled}
          onAdd={(name) => onAdd(levelId, name)}
        />
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DraftSubject } from "@/hooks/admin/useSchoolProfileDraft"

interface SubjectStepProps {
  levelId: string
  levelLabel: string
  subjects: DraftSubject[]
  onAdd: (levelId: string, name: string, subjectType: DraftSubject["subjectType"]) => void
  onRename: (subjectKey: string, name: string) => void
  onDelete: (subjectKey: string) => void
  onSetType: (subjectKey: string, subjectType: DraftSubject["subjectType"]) => void
  disabled?: boolean
}

const TYPES: DraftSubject["subjectType"][] = ["major", "minor"]

export function SubjectTypeToggle({
  value,
  onChange,
  disabled,
}: {
  value: DraftSubject["subjectType"]
  onChange: (next: DraftSubject["subjectType"]) => void
  disabled?: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {TYPES.map((t) => (
        <Button
          key={t}
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          title={
            t === "minor"
              ? "Mark as minor / shared — moves to this department's shared subjects"
              : "Mark as major — keeps it on this level"
          }
          className={cn(
            "h-6 px-2 text-[10px] font-medium capitalize",
            value === t && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => onChange(t)}
        >
          {t}
        </Button>
      ))}
    </div>
  )
}

export function SubjectStep({
  levelId,
  levelLabel,
  subjects,
  onAdd,
  onRename,
  onDelete,
  onSetType,
  disabled = false,
}: SubjectStepProps) {
  const [newType, setNewType] = useState<DraftSubject["subjectType"]>("major")
  const majors = subjects.filter((s) => s.subjectType === "major")
  const minors = subjects.filter((s) => s.subjectType === "minor")

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground not-interactive">{levelLabel}</p>
      </div>

      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">No subjects yet.</p>
      )}

      <div className="space-y-1.5">
        {majors.map((subject) => (
          <div key={subject.key} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <EditableItemRow
                label={subject.name}
                disabled={disabled}
                onRename={(name) => onRename(subject.key, name)}
                onDelete={() => onDelete(subject.key)}
              />
            </div>
            <SubjectTypeToggle
              value={subject.subjectType}
              onChange={(next) => onSetType(subject.key, next)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      {minors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground not-interactive">
            Minors on this level
          </p>
          {minors.map((subject) => (
            <div key={subject.key} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <EditableItemRow
                  label={subject.name}
                  disabled={disabled}
                  onRename={(name) => onRename(subject.key, name)}
                  onDelete={() => onDelete(subject.key)}
                />
              </div>
              <SubjectTypeToggle
                value={subject.subjectType}
                onChange={(next) => onSetType(subject.key, next)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="space-y-2 border-t pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground not-interactive">
              New subject as
            </span>
            <SubjectTypeToggle
              value={newType}
              onChange={setNewType}
              disabled={disabled}
            />
          </div>
          <AddItemInput
            placeholder="e.g. Mathematics"
            disabled={disabled}
            onAdd={(name) => onAdd(levelId, name, newType)}
          />
        </div>
      )}
    </div>
  )
}
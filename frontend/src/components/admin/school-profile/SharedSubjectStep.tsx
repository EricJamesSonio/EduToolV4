"use client"

import { Layers } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import { Button } from "@/components/ui/button"
import type { DraftSubject } from "@/hooks/admin/useSchoolProfileDraft"

interface SharedSubjectStepProps {
  subjects: DraftSubject[]
  /** Level names available in this department, in display order. */
  levelNames: string[]
  /** Level currently being viewed; new shared subjects are created for it. */
  activeLevelName: string | null
  onAdd: (name: string) => void
  onRename: (subjectKey: string, name: string) => void
  onDelete: (subjectKey: string) => void
  onSetLevel: (subjectKey: string, levelName: string | null) => void
  onPromote: (subjectKey: string) => void
  canPromote: boolean
  disabled?: boolean
}

/**
 * Department-level shared (minor) subjects. Each one applies to a single level
 * and is shared only with the courses/strands that have that level. Promoting
 * one hands it to that level of the course being viewed as a major.
 */
export function SharedSubjectStep({
  subjects,
  levelNames,
  activeLevelName,
  onAdd,
  onRename,
  onDelete,
  onSetLevel,
  onPromote,
  canPromote,
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
        Shared across this department&apos;s courses/strands, but only at the level
        you pick. Promote one to make it a major on that level.
      </p>

      {subjects.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">
          No shared subjects yet.
        </p>
      )}

      <div className="space-y-1.5">
        {subjects.map((subject) => {
          const options =
            subject.levelName && !levelNames.includes(subject.levelName)
              ? [...levelNames, subject.levelName]
              : levelNames
          return (
            <div key={subject.key} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <EditableItemRow
                  label={subject.name}
                  disabled={disabled}
                  onRename={(name) => onRename(subject.key, name)}
                  onDelete={() => onDelete(subject.key)}
                />
              </div>
              <select
                aria-label={`Level for ${subject.name}`}
                value={subject.levelName ?? ""}
                disabled={disabled}
                onChange={(e) => onSetLevel(subject.key, e.target.value === "" ? null : e.target.value)}
                className="h-8 shrink-0 rounded-md border bg-background px-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">All levels</option>
                {options.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {!disabled && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 shrink-0 px-2 text-[10px]"
                  disabled={!canPromote}
                  onClick={() => onPromote(subject.key)}
                  title={
                    subject.levelName
                      ? `Move to ${subject.levelName} as a major subject`
                      : "Move to the level you are viewing as a major subject"
                  }
                >
                  Make major
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {activeLevelName ? (
        <p className="text-[10px] text-muted-foreground not-interactive">
          New shared subjects apply to: {activeLevelName}
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground not-interactive">
          Add a level first to create shared subjects.
        </p>
      )}

      {!disabled && activeLevelName && (
        <AddItemInput
          placeholder="e.g. General Education"
          disabled={disabled}
          onAdd={onAdd}
        />
      )}
    </div>
  )
}
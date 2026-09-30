"use client"

import { cn } from "@/lib/utils"
import { SubjectStep } from "./SubjectStep"
import { SharedSubjectStep } from "./SharedSubjectStep"
import { LevelPillLabel } from "./ui/ProfileCard"
import type { DraftDepartment, DraftLevel, useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"

interface ScopedSubjectsProps {
  department: DraftDepartment
  levels: DraftLevel[]
  levelOptions: { key: string; label: string }[]
  expandedLevelKey: string | null
  onToggleLevel: (key: string) => void
  readOnly: boolean
  saving: boolean
  draft: ReturnType<typeof useSchoolProfileDraft>
}

export function ScopedSubjects({
  department,
  levels,
  levelOptions,
  expandedLevelKey,
  onToggleLevel,
  readOnly,
  saving,
  draft,
}: ScopedSubjectsProps) {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)
  const activeLevel = sorted.find((l) => l.key === expandedLevelKey) ?? sorted[0] ?? null

  return (
    <div className="space-y-3">
      {sorted.length > 0 ? (
        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <p className="text-xs font-medium text-muted-foreground not-interactive">
            Select a level to edit its subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((level) => {
              const selected = activeLevel?.key === level.key
              return (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => onToggleLevel(level.key)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted/50 border-muted-foreground/20",
                  )}
                >
                  <LevelPillLabel level={level} />
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
          No levels yet. Add one under the Levels &amp; Sections tab first.
        </p>
      )}

      {activeLevel ? (
        <SubjectStep
          levelId={activeLevel.key}
          levelLabel={`${activeLevel.name} — Subjects`}
          subjects={activeLevel.subjects}
          disabled={readOnly || saving}
          onAdd={(_levelKey, name, subjectType) => draft.addSubject(department.type, activeLevel.key, name, subjectType)}
          onRename={(subjectKey, name) => draft.renameSubject(department.type, activeLevel.key, subjectKey, name)}
          onDelete={(subjectKey) => draft.deleteSubject(department.type, activeLevel.key, subjectKey)}
          onSetType={(subjectKey, subjectType) =>
            draft.setSubjectType(department.type, activeLevel.key, subjectKey, subjectType)
          }
        />
      ) : null}

      <SharedSubjectStep
        subjects={department.subjects}
        levelOptions={levelOptions}
        disabled={readOnly || saving}
        onAdd={(name) => draft.addSubject(department.type, activeLevel?.key ?? "", name, "minor")}
        onRename={(subjectKey, name) => draft.renameSharedSubject(department.type, subjectKey, name)}
        onDelete={(subjectKey) => draft.deleteSharedSubject(department.type, subjectKey)}
        onPromote={(subjectKey, _levelKey) =>
          draft.promoteSharedSubjectToLevel(department.type, subjectKey, activeLevel?.key ?? _levelKey)
        }
      />
    </div>
  )
}

"use client"

import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SectionStep } from "./SectionStep"
import { LevelPillLabel } from "./ui/ProfileCard"
import type { DraftDepartment, DraftLevel, useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"

interface NestedLevelsSectionsProps {
  department: DraftDepartment
  levels: DraftLevel[]
  groupLabel: string | null
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
  expandedLevelKey,
  onToggleLevel,
  readOnly,
  saving,
  draft,
}: NestedLevelsSectionsProps) {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)

  if (sorted.length === 0) {
    return (
      <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
        {groupLabel
          ? `No levels in ${groupLabel} yet. Add one under the Structure tab.`
          : "No levels yet. Add one under the Structure tab."}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((level) => {
        const expanded = level.key === expandedLevelKey
        return (
          <div key={level.key} className="rounded-lg border bg-background overflow-hidden">
            <button
              type="button"
              onClick={() => onToggleLevel(level.key)}
              aria-expanded={expanded}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 text-sm font-medium">
                <LevelPillLabel level={level} />
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] tabular-nums",
                  expanded ? "border-primary bg-primary/10" : "border-muted-foreground/20 text-muted-foreground",
                )}
              >
                {level.sections.length} {level.sections.length === 1 ? "section" : "sections"}
              </span>
            </button>
            {expanded && (
              <div className="ml-5 border-l-2 border-muted pl-3 pr-3 pb-3">
                <SectionStep
                  levelId={level.key}
                  levelLabel={`${level.name} — Sections`}
                  sections={level.sections}
                  disabled={readOnly || saving}
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
    </div>
  )
}

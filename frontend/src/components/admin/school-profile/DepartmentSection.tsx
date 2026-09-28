"use client"

import { LayoutList } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { CourseStep } from "./CourseStep"
import { StrandStep } from "./StrandStep"
import { LevelStep } from "./LevelStep"
import { NestedLevelsSections } from "./NestedLevelsSections"
import { ScopedSubjects } from "./ScopedSubjects"
import { Card, CollapsibleDepartmentCard } from "./ui/ProfileCard"
import type { DraftDepartment, useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"
import type { SchoolProfileSubTab } from "./hooks/useSchoolProfileCardState"

interface DepartmentSectionProps {
  department: DraftDepartment
  readOnly: boolean
  saving: boolean
  expandedCourseKey: string | null
  expandedLevelKey: string | null
  onToggleCourse: (key: string) => void
  onToggleLevel: (key: string) => void
  draft: ReturnType<typeof useSchoolProfileDraft>
  subTab: SchoolProfileSubTab
  onSubTabChange: (tab: SchoolProfileSubTab) => void
}

const SUB_TABS: { key: SchoolProfileSubTab; label: string }[] = [
  { key: "structure", label: "Structure" },
  { key: "levels", label: "Levels & Sections" },
  { key: "subjects", label: "Subjects" },
]

/**
 * One department's scoped editor: Structure (courses/strands + levels),
 * Levels & Sections (nested Level -> Sections tree), Subjects (level-scoped
 * majors + shared minors). Only one pane renders at a time so a configured
 * department no longer needs a full-page scroll.
 */
export function DepartmentSection({
  department,
  readOnly,
  saving,
  expandedCourseKey,
  expandedLevelKey,
  onToggleCourse,
  onToggleLevel,
  draft,
  subTab,
  onSubTabChange,
}: DepartmentSectionProps) {
  const isCollege = department.type === "college"
  const isShs = department.type === "shs"

  const activeCourse = isCollege
    ? department.courses.find((c) => c.key === expandedCourseKey) ?? department.courses[0] ?? null
    : null
  const activeStrand = isShs
    ? department.strands.find((s) => s.key === expandedCourseKey) ?? department.strands[0] ?? null
    : null

  const levelsForLevelsTab = isCollege
    ? (activeCourse?.levels ?? [])
    : isShs
      ? (activeStrand?.levels ?? [])
      : department.levels

  const levelsForSubjectsTab = levelsForLevelsTab

  const groupLabel = isCollege
    ? (activeCourse?.name ?? null)
    : isShs
      ? (activeStrand?.name ?? null)
      : null

  const levelOptions = isCollege
    ? department.courses.flatMap((c) => c.levels.map((l) => ({ key: l.key, label: `${c.name} · ${l.name}` })))
    : isShs
      ? department.strands.flatMap((s) => s.levels.map((l) => ({ key: l.key, label: `${s.name} · ${l.name}` })))
      : department.levels.map((l) => ({ key: l.key, label: l.name }))

  const pillClass = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background hover:bg-muted/50 border-muted-foreground/20",
    )

  const groupPicker = isCollege && department.courses.length > 0
    ? (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground not-interactive">
          {subTab === "structure" ? "Select a course to manage its levels" : "Select a course to view its levels & sections"}
        </p>
        <div className="flex flex-wrap gap-2">
          {department.courses.map((course) => (
            <button
              key={course.key}
              type="button"
              onClick={() => onToggleCourse(course.key)}
              aria-pressed={(activeCourse?.key ?? null) === course.key}
              className={pillClass((activeCourse?.key ?? null) === course.key)}
            >
              {course.name}
            </button>
          ))}
        </div>
      </div>
    )
    : isShs && department.strands.length > 0
      ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground not-interactive">
            {subTab === "structure" ? "Select a strand to manage its levels" : "Select a strand to view its levels & sections"}
          </p>
          <div className="flex flex-wrap gap-2">
            {department.strands.map((strand) => (
              <button
                key={strand.key}
                type="button"
                onClick={() => onToggleCourse(strand.key)}
                aria-pressed={(activeStrand?.key ?? null) === strand.key}
                className={pillClass((activeStrand?.key ?? null) === strand.key)}
              >
                {strand.name}
              </button>
            ))}
          </div>
        </div>
      )
      : null

  const content = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-lg border bg-muted/30 p-1" role="tablist" aria-label="Department sections">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={subTab === t.key}
            onClick={() => onSubTabChange(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              subTab === t.key ? "bg-background shadow-sm border" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "structure" && (
        <div className="space-y-5">
          {isCollege && (
            <CourseStep
              departmentId={department.type}
              courses={department.courses}
              disabled={readOnly || saving}
              onAdd={(_, name) => draft.addCourse(department.type, name)}
              onRename={(courseKey, name) => draft.renameCourse(department.type, courseKey, name)}
              onDelete={(courseKey) => draft.deleteCourse(department.type, courseKey)}
            />
          )}

          {isShs && (
            <StrandStep
              departmentId={department.type}
              strands={department.strands}
              disabled={readOnly || saving}
              onAdd={(_, name) => draft.addStrand(department.type, name)}
              onRename={(strandKey, name) => draft.renameStrand(department.type, strandKey, name)}
              onDelete={(strandKey) => draft.deleteStrand(department.type, strandKey)}
            />
          )}

          {(isCollege || isShs) && groupPicker}

          {isCollege &&
            (activeCourse ? (
              <LevelStep
                key={activeCourse.key}
                parentId={activeCourse.key}
                groupLabel={activeCourse.name}
                programType={department.type}
                levels={activeCourse.levels}
                disabled={readOnly || saving}
                onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
              />
            ) : (
              <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
                Add a course above to create its levels.
              </p>
            ))}

          {isShs &&
            (activeStrand ? (
              <LevelStep
                key={activeStrand.key}
                parentId={activeStrand.key}
                groupLabel={activeStrand.name}
                programType={department.type}
                levels={activeStrand.levels}
                disabled={readOnly || saving}
                onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
              />
            ) : (
              <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
                Add a strand above to create its levels.
              </p>
            ))}

          {!isCollege && !isShs && (
            <LevelStep
              parentId={department.type}
              groupLabel="Levels"
              programType={department.type}
              levels={department.levels}
              disabled={readOnly || saving}
              onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
              onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
              onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
            />
          )}
        </div>
      )}

      {subTab === "levels" && (
        <div className="space-y-3">
          {(isCollege || isShs) && groupPicker}
          <NestedLevelsSections
            department={department}
            levels={levelsForLevelsTab}
            groupLabel={groupLabel}
            expandedLevelKey={expandedLevelKey}
            onToggleLevel={onToggleLevel}
            readOnly={readOnly}
            saving={saving}
            draft={draft}
          />
        </div>
      )}

      {subTab === "subjects" && (
        <div className="space-y-3">
          {(isCollege || isShs) && groupPicker}
          <ScopedSubjects
            department={department}
            levels={levelsForSubjectsTab}
            levelOptions={levelOptions}
            expandedLevelKey={expandedLevelKey}
            onToggleLevel={onToggleLevel}
            readOnly={readOnly}
            saving={saving}
            draft={draft}
          />
        </div>
      )}
    </div>
  )

  if (readOnly) {
    return (
      <CollapsibleDepartmentCard
        id="structure"
        icon={LayoutList}
        title={PROGRAM_TYPE_LABELS[department.type]}
        defaultOpen={false}
      >
        {content}
      </CollapsibleDepartmentCard>
    )
  }

  return (
    <Card id="structure" icon={LayoutList} title={PROGRAM_TYPE_LABELS[department.type]}>
      {content}
    </Card>
  )
}

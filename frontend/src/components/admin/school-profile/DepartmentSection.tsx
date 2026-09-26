"use client"

import { LayoutList } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { CourseStep } from "./CourseStep"
import { StrandStep } from "./StrandStep"
import { LevelStep } from "./LevelStep"
import { SectionStep } from "./SectionStep"
import { SubjectStep } from "./SubjectStep"
import { SharedSubjectStep } from "./SharedSubjectStep"
import { Card, CollapsibleDepartmentCard, LevelPillLabel } from "./ui/ProfileCard"
import type { DraftDepartment, useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"

interface DepartmentSectionProps {
  department: DraftDepartment
  readOnly: boolean
  saving: boolean
  expandedCourseKey: string | null
  expandedLevelKey: string | null
  onToggleCourse: (key: string) => void
  onToggleLevel: (key: string) => void
  draft: ReturnType<typeof useSchoolProfileDraft>
}

/**
 * One department's full editor: course/strand list, level list, the
 * course/strand → level pill-picker accordion, the active level's Sections
 * & Subjects editors, and the department's shared/minor subjects. Split out
 * of SchoolProfileCard.tsx because this block alone was ~230 of that file's
 * ~470 lines.
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
}: DepartmentSectionProps) {
  const isCollege = department.type === "college"
  const isShs = department.type === "shs"

  const activeCourse = isCollege
    ? department.courses.find((c) => c.key === expandedCourseKey) ?? null
    : null
  const activeStrand = isShs
    ? department.strands.find((s) => s.key === expandedCourseKey) ?? null
    : null

  const getActiveLevel = (): DraftDepartment["levels"][number] | null => {
    if (isCollege) {
      if (!activeCourse) return null
      return activeCourse.levels.find((l) => l.key === expandedLevelKey) ?? null
    }
    if (isShs) {
      if (!activeStrand) return null
      return activeStrand.levels.find((l) => l.key === expandedLevelKey) ?? null
    }
    return department.levels.find((l) => l.key === expandedLevelKey) ?? null
  }

  const levelOptions = isCollege
    ? department.courses.flatMap((c) => c.levels.map((l) => ({ key: l.key, label: `${c.name} · ${l.name}` })))
    : isShs
      ? department.strands.flatMap((s) => s.levels.map((l) => ({ key: l.key, label: `${s.name} · ${l.name}` })))
      : department.levels.map((l) => ({ key: l.key, label: l.name }))

  const activeLevel = getActiveLevel()

  const pillClass = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-background hover:bg-muted/50 border-muted-foreground/20",
    )

  const content = (
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

      {isCollege &&
        department.courses.map((course) => (
          <LevelStep
            key={course.key}
            parentId={course.key}
            groupLabel={course.name}
            levels={course.levels}
            disabled={readOnly || saving}
            onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
            onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
            onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
          />
        ))}

      {isShs &&
        department.strands.map((strand) => (
          <LevelStep
            key={strand.key}
            parentId={strand.key}
            groupLabel={strand.name}
            levels={strand.levels}
            disabled={readOnly || saving}
            onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
            onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
            onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
          />
        ))}

      {!isCollege && !isShs && (
        <LevelStep
          parentId={department.type}
          groupLabel="Levels"
          levels={department.levels}
          disabled={readOnly || saving}
          onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
          onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
          onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
        />
      )}

      {/* Pill row — level scoped accordion (course/strand → level) */}
      {isCollege && department.courses.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <p className="text-xs font-medium text-muted-foreground not-interactive">
            Select a course, then a level to edit its sections &amp; subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {department.courses.map((course) => (
              <button
                key={course.key}
                type="button"
                onClick={() => onToggleCourse(course.key)}
                className={pillClass(expandedCourseKey === course.key)}
              >
                {course.name}
              </button>
            ))}
          </div>
          {activeCourse && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground not-interactive">
                Levels in {activeCourse.name} — sections &amp; subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {[...activeCourse.levels]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((level) => (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() => onToggleLevel(level.key)}
                      className={pillClass(expandedLevelKey === level.key)}
                    >
                      <LevelPillLabel level={level} />
                    </button>
                  ))}
              </div>
              {activeCourse.levels.length === 0 && (
                <p className="text-xs text-muted-foreground not-interactive">
                  No levels in this course yet. Add one above.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {isShs && department.strands.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <p className="text-xs font-medium text-muted-foreground not-interactive">
            Select a strand, then a level to edit its sections &amp; subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {department.strands.map((strand) => (
              <button
                key={strand.key}
                type="button"
                onClick={() => onToggleCourse(strand.key)}
                className={pillClass(expandedCourseKey === strand.key)}
              >
                {strand.name}
              </button>
            ))}
          </div>
          {activeStrand && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground not-interactive">
                Levels in {activeStrand.name} — sections &amp; subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {[...activeStrand.levels]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((level) => (
                    <button
                      key={level.key}
                      type="button"
                      onClick={() => onToggleLevel(level.key)}
                      className={pillClass(expandedLevelKey === level.key)}
                    >
                      <LevelPillLabel level={level} />
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!isCollege && !isShs && department.levels.length > 0 && (
        <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
          <p className="text-xs font-medium text-muted-foreground not-interactive">
            Select a level to edit its sections &amp; subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {[...department.levels]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((level) => (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => onToggleLevel(level.key)}
                  className={pillClass(expandedLevelKey === level.key)}
                >
                  <LevelPillLabel level={level} />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Level-scoped editors — single expanded level only (accordion) */}
      {activeLevel ? (
        <div className="space-y-3">
          <SectionStep
            levelId={activeLevel.key}
            levelLabel={`${activeLevel.name} — Sections`}
            sections={activeLevel.sections}
            disabled={readOnly || saving}
            onAdd={(levelKey, name, capacity) => draft.addSection(department.type, activeLevel.key, name, capacity)}
            onUpdate={(sectionKey, name, capacity) =>
              draft.updateSection(department.type, activeLevel.key, sectionKey, name, capacity)
            }
            onDelete={(sectionKey) => draft.deleteSection(department.type, activeLevel.key, sectionKey)}
          />
          <SubjectStep
            levelId={activeLevel.key}
            levelLabel={`${activeLevel.name} — Subjects`}
            subjects={activeLevel.subjects}
            disabled={readOnly || saving}
            onAdd={(levelKey, name, subjectType) => draft.addSubject(department.type, activeLevel.key, name, subjectType)}
            onRename={(subjectKey, name) => draft.renameSubject(department.type, activeLevel.key, subjectKey, name)}
            onDelete={(subjectKey) => draft.deleteSubject(department.type, activeLevel.key, subjectKey)}
            onSetType={(subjectKey, subjectType) => draft.setSubjectType(department.type, activeLevel.key, subjectKey, subjectType)}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground not-interactive rounded-lg border border-dashed p-3 text-center">
          {isCollege && department.courses.length === 0
            ? "This department has no courses yet. Add a course above to create its levels, sections & subjects."
            : isShs && department.strands.length === 0
              ? "This department has no strands yet. Add a strand above to create its levels, sections & subjects."
              : isCollege && activeCourse && activeCourse.levels.length === 0
                ? "This course has no levels yet. Add one above to create its sections & subjects."
                : isShs && activeStrand && activeStrand.levels.length === 0
                  ? "This strand has no levels yet. Add one above to create its sections & subjects."
                  : "Select a level above to edit its sections & subjects."}
        </p>
      )}

      <SharedSubjectStep
        subjects={department.subjects}
        levelOptions={levelOptions}
        disabled={readOnly || saving}
        onAdd={(name) => draft.addSubject(department.type, activeLevel?.key ?? "", name, "minor")}
        onRename={(subjectKey, name) => draft.renameSharedSubject(department.type, subjectKey, name)}
        onDelete={(subjectKey) => draft.deleteSharedSubject(department.type, subjectKey)}
        onPromote={(subjectKey, levelKey) => draft.promoteSharedSubjectToLevel(department.type, subjectKey, levelKey)}
      />
    </div>
  )

  return readOnly ? (
    <CollapsibleDepartmentCard
      id="structure"
      icon={LayoutList}
      title={PROGRAM_TYPE_LABELS[department.type]}
      defaultOpen={false}
    >
      {content}
    </CollapsibleDepartmentCard>
  ) : (
    <Card id="structure" icon={LayoutList} title={PROGRAM_TYPE_LABELS[department.type]}>
      {content}
    </Card>
  )
}
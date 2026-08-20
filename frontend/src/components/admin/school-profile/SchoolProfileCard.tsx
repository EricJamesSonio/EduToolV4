"use client"

import { useEffect, useState } from "react"
import { Layers, LayoutList, Loader2, Database } from "lucide-react"
import { cn, pickCardColor } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useNavigationGuard } from "@/context/NavigationGuardContext"
import { toast } from "sonner"
import { isAxiosError } from "axios"
import type { ProgramType } from "@/types/admin/program.types"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { useSchoolProfile, useSaveSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"
import { DepartmentStep } from "./DepartmentStep"
import { CourseStep } from "./CourseStep"
import { StrandStep } from "./StrandStep"
import { LevelStep } from "./LevelStep"
import { SectionStep } from "./SectionStep"
import { SubjectStep } from "./SubjectStep"
import type { DraftDepartment } from "@/hooks/admin/useSchoolProfileDraft"

function Card({ id, icon: Icon, title, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className={`icon-container ${pickCardColor(id)} shrink-0 mt-0.5`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="font-semibold text-lg leading-tight not-interactive">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function collectAllLevels(dept: DraftDepartment) {
  return [
    ...dept.levels.map((l) => ({ ...l, groupLabel: PROGRAM_TYPE_LABELS[dept.type] })),
    ...dept.courses.flatMap((c) => c.levels.map((l) => ({ ...l, groupLabel: c.name, parentKey: c.key }))),
    ...dept.strands.flatMap((s) => s.levels.map((l) => ({ ...l, groupLabel: s.name, parentKey: s.key }))),
  ]
}

export function SchoolProfileCard() {
  const { data: savedDepartments = [], isLoading } = useSchoolProfile()
  const draft = useSchoolProfileDraft(savedDepartments)
  const saveMutation = useSaveSchoolProfile()

  const [pendingDeselect, setPendingDeselect] = useState<ProgramType | null>(null)

  const { setGuard } = useNavigationGuard()
  useEffect(() => {
    setGuard(() => draft.dirty)
    return () => setGuard(null)
  }, [draft.dirty, setGuard])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (draft.dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [draft.dirty])

  const handleToggleDepartment = (type: ProgramType) => {
    if (draft.selectedTypes.has(type)) {
      setPendingDeselect(type)
    } else {
      draft.selectDepartment(type)
    }
  }

  const confirmDeselect = () => {
    if (!pendingDeselect) return
    draft.deselectDepartment(pendingDeselect)
    setPendingDeselect(null)
  }

  const handleSave = () => {
    saveMutation.mutate(Object.values(draft.departments), {
      onSuccess: () => {
        toast.success("Configuration saved. The Data Seeder will now use this setup.")
        draft.markSaved()
      },
      onError: (err: unknown) => {
        const message =
          isAxiosError<{ message?: string }>(err) && err.response?.data?.message
            ? err.response.data.message
            : "Failed to save configuration. Please try again."
        toast.error(message)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground not-interactive">Loading school profile…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card id="departments" icon={Layers} title="Departments">
        <DepartmentStep
          selectedTypes={draft.selectedTypes}
          onToggle={handleToggleDepartment}
          disabled={saveMutation.isPending}
        />
      </Card>

      {Object.values(draft.departments).map((department) => (
        <Card
          key={department.type}
          id="structure"
          icon={LayoutList}
          title={PROGRAM_TYPE_LABELS[department.type]}
        >
          <div className="space-y-5">
            {department.type === "college" && (
              <CourseStep
                departmentId={department.type}
                courses={department.courses}
                disabled={saveMutation.isPending}
                onAdd={(_, name) => draft.addCourse(department.type, name)}
                onRename={(courseKey, name) => draft.renameCourse(department.type, courseKey, name)}
                onDelete={(courseKey) => draft.deleteCourse(department.type, courseKey)}
              />
            )}

            {department.type === "shs" && (
              <StrandStep
                departmentId={department.type}
                strands={department.strands}
                disabled={saveMutation.isPending}
                onAdd={(_, name) => draft.addStrand(department.type, name)}
                onRename={(strandKey, name) => draft.renameStrand(department.type, strandKey, name)}
                onDelete={(strandKey) => draft.deleteStrand(department.type, strandKey)}
              />
            )}

            {department.type === "college" &&
              department.courses.map((course) => (
                <LevelStep
                  key={course.key}
                  parentId={course.key}
                  groupLabel={course.name}
                  levels={course.levels}
                  disabled={saveMutation.isPending}
                  onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                  onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                  onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
                />
              ))}

            {department.type === "shs" &&
              department.strands.map((strand) => (
                <LevelStep
                  key={strand.key}
                  parentId={strand.key}
                  groupLabel={strand.name}
                  levels={strand.levels}
                  disabled={saveMutation.isPending}
                  onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                  onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                  onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
                />
              ))}

            {department.type !== "college" && department.type !== "shs" && (
              <LevelStep
                parentId={department.type}
                groupLabel="Levels"
                levels={department.levels}
                disabled={saveMutation.isPending}
                onAdd={(parentKey, name) => draft.addLevel(department.type, parentKey, name)}
                onRename={(levelKey, name) => draft.renameLevel(department.type, levelKey, name)}
                onDelete={(levelKey) => draft.deleteLevel(department.type, levelKey)}
              />
            )}

            {collectAllLevels(department).map((level) => (
              <div key={level.key} className="space-y-3">
                <SectionStep
                  levelId={level.key}
                  levelLabel={`${level.name} — Sections`}
                  sections={level.sections}
                  disabled={saveMutation.isPending}
                  onAdd={(levelKey, name, capacity) => draft.addSection(department.type, levelKey, name, capacity)}
                  onUpdate={(sectionKey, name, capacity) =>
                    draft.updateSection(department.type, level.key, sectionKey, name, capacity)
                  }
                  onDelete={(sectionKey) => draft.deleteSection(department.type, level.key, sectionKey)}
                />
                <SubjectStep
                  levelId={level.key}
                  levelLabel={`${level.name} — Subjects`}
                  subjects={level.subjects}
                  disabled={saveMutation.isPending}
                  onAdd={(levelKey, name) => draft.addSubject(department.type, levelKey, name)}
                  onRename={(subjectKey, name) => draft.renameSubject(department.type, level.key, subjectKey, name)}
                  onDelete={(subjectKey) => draft.deleteSubject(department.type, level.key, subjectKey)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      {draft.selectedTypes.size > 0 && (
        <Card id="save" icon={Database} title="Save Configuration">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground not-interactive">
              Saving replaces the Data Seeder&apos;s predefined data for your selected departments
              with this configuration. Unselected departments are left untouched.
            </p>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="shrink-0">
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!pendingDeselect}
        title="Remove this department?"
        message={
          pendingDeselect
            ? `This removes "${PROGRAM_TYPE_LABELS[pendingDeselect]}" from your configuration draft. It won't be saved unless you click Save Configuration — your existing saved data (if any) stays untouched until then.`
            : ""
        }
        confirmLabel="Remove from Draft"
        destructive
        onConfirm={confirmDeselect}
        onOpenChange={(o) => {
          if (!o) setPendingDeselect(null)
        }}
      />
    </div>
  )
}
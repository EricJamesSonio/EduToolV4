"use client"

import { Layers, LayoutList } from "lucide-react"
import { cn, pickCardColor } from "@/lib/utils"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useState } from "react"
import type { ProgramType } from "@/types/admin/program.types"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import {
  useSchoolProfile,
  useSelectDepartment,
  useDeselectDepartment,
  useCreateProfileCourse,
  useUpdateProfileCourse,
  useDeleteProfileCourse,
  useCreateProfileStrand,
  useUpdateProfileStrand,
  useDeleteProfileStrand,
  useCreateProfileLevel,
  useUpdateProfileLevel,
  useDeleteProfileLevel,
  useCreateProfileSection,
  useUpdateProfileSection,
  useDeleteProfileSection,
  useCreateProfileSubject,
  useUpdateProfileSubject,
  useDeleteProfileSubject,
} from "@/hooks/admin/useSchoolProfile"
import { DepartmentStep } from "./DepartmentStep"
import { CourseStep } from "./CourseStep"
import { StrandStep } from "./StrandStep"
import { LevelStep } from "./LevelStep"
import { SectionStep } from "./SectionStep"
import { SubjectStep } from "./SubjectStep"

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

export function SchoolProfileCard() {
  const { data: departments = [], isLoading } = useSchoolProfile()

  const selectDepartment = useSelectDepartment()
  const deselectDepartment = useDeselectDepartment()
  const createCourse = useCreateProfileCourse()
  const updateCourse = useUpdateProfileCourse()
  const deleteCourse = useDeleteProfileCourse()
  const createStrand = useCreateProfileStrand()
  const updateStrand = useUpdateProfileStrand()
  const deleteStrand = useDeleteProfileStrand()
  const createLevel = useCreateProfileLevel()
  const updateLevel = useUpdateProfileLevel()
  const deleteLevel = useDeleteProfileLevel()
  const createSection = useCreateProfileSection()
  const updateSection = useUpdateProfileSection()
  const deleteSection = useDeleteProfileSection()
  const createSubject = useCreateProfileSubject()
  const updateSubject = useUpdateProfileSubject()
  const deleteSubject = useDeleteProfileSubject()

  const [pendingDeselect, setPendingDeselect] = useState<ProgramType | null>(null)

  const selectedTypes = new Set(departments.map((d) => d.type))

  const handleToggleDepartment = (type: ProgramType) => {
    if (selectedTypes.has(type)) {
      setPendingDeselect(type)
    } else {
      selectDepartment.mutate(type)
    }
  }

  const confirmDeselect = () => {
    if (!pendingDeselect) return
    deselectDepartment.mutate(pendingDeselect)
    setPendingDeselect(null)
  }

  const anyMutating =
    selectDepartment.isPending ||
    deselectDepartment.isPending ||
    createCourse.isPending ||
    updateCourse.isPending ||
    deleteCourse.isPending ||
    createStrand.isPending ||
    updateStrand.isPending ||
    deleteStrand.isPending ||
    createLevel.isPending ||
    updateLevel.isPending ||
    deleteLevel.isPending ||
    createSection.isPending ||
    updateSection.isPending ||
    deleteSection.isPending ||
    createSubject.isPending ||
    updateSubject.isPending ||
    deleteSubject.isPending

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
          selectedTypes={selectedTypes}
          onToggle={handleToggleDepartment}
          disabled={anyMutating}
        />
      </Card>

      {departments.map((department) => (
        <Card
          key={department.id}
          id="structure"
          icon={LayoutList}
          title={PROGRAM_TYPE_LABELS[department.type]}
        >
          <div className="space-y-5">
            {department.type === "college" && (
              <CourseStep
                departmentId={department.id}
                courses={department.courses}
                disabled={anyMutating}
                onAdd={(departmentId, name) => createCourse.mutate({ departmentId, data: { name } })}
                onRename={(id, name) => updateCourse.mutate({ id, data: { name } })}
                onDelete={(id) => deleteCourse.mutate(id)}
              />
            )}

            {department.type === "shs" && (
              <StrandStep
                departmentId={department.id}
                strands={department.strands}
                disabled={anyMutating}
                onAdd={(departmentId, name) => createStrand.mutate({ departmentId, data: { name } })}
                onRename={(id, name) => updateStrand.mutate({ id, data: { name } })}
                onDelete={(id) => deleteStrand.mutate(id)}
              />
            )}

            {department.type === "college" &&
              department.courses.map((course) => (
                <LevelStep
                  key={course.id}
                  parentId={course.id}
                  groupLabel={course.name}
                  levels={course.levels}
                  disabled={anyMutating}
                  onAdd={(courseId, name, orderIndex) =>
                    createLevel.mutate({ departmentId: department.id, data: { name, courseId, orderIndex } })
                  }
                  onRename={(id, name) => updateLevel.mutate({ id, data: { name } })}
                  onDelete={(id) => deleteLevel.mutate(id)}
                />
              ))}

            {department.type === "shs" &&
              department.strands.map((strand) => (
                <LevelStep
                  key={strand.id}
                  parentId={strand.id}
                  groupLabel={strand.name}
                  levels={strand.levels}
                  disabled={anyMutating}
                  onAdd={(strandId, name, orderIndex) =>
                    createLevel.mutate({ departmentId: department.id, data: { name, strandId, orderIndex } })
                  }
                  onRename={(id, name) => updateLevel.mutate({ id, data: { name } })}
                  onDelete={(id) => deleteLevel.mutate(id)}
                />
              ))}

            {department.type !== "college" && department.type !== "shs" && (
              <LevelStep
                parentId={department.id}
                groupLabel="Levels"
                levels={department.levels}
                disabled={anyMutating}
                onAdd={(departmentId, name, orderIndex) =>
                  createLevel.mutate({ departmentId, data: { name, orderIndex } })
                }
                onRename={(id, name) => updateLevel.mutate({ id, data: { name } })}
                onDelete={(id) => deleteLevel.mutate(id)}
              />
            )}

            {[
              ...department.levels,
              ...department.courses.flatMap((c) => c.levels),
              ...department.strands.flatMap((s) => s.levels),
            ].map((level) => (
              <div key={level.id} className="space-y-3">
                <SectionStep
                  levelId={level.id}
                  levelLabel={`${level.name} — Sections`}
                  sections={level.sections}
                  disabled={anyMutating}
                  onAdd={(levelId, name, capacity) =>
                    createSection.mutate({ levelId, data: { name, capacity } })
                  }
                  onUpdate={(id, name, capacity) => updateSection.mutate({ id, data: { name, capacity } })}
                  onDelete={(id) => deleteSection.mutate(id)}
                />
                <SubjectStep
                  levelId={level.id}
                  levelLabel={`${level.name} — Subjects`}
                  subjects={level.subjects}
                  disabled={anyMutating}
                  onAdd={(levelId, name) => createSubject.mutate({ levelId, data: { name } })}
                  onRename={(id, name) => updateSubject.mutate({ id, data: { name } })}
                  onDelete={(id) => deleteSubject.mutate(id)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <ConfirmDialog
        open={!!pendingDeselect}
        title="Remove this department?"
        message={
          pendingDeselect
            ? `This will delete everything configured under "${PROGRAM_TYPE_LABELS[pendingDeselect]}" — courses/strands, levels, sections, and subjects. This can't be undone.`
            : ""
        }
        confirmLabel="Remove Department"
        destructive
        isLoading={deselectDepartment.isPending}
        onConfirm={confirmDeselect}
        onOpenChange={(o) => {
          if (!o) setPendingDeselect(null)
        }}
      />
    </div>
  )
}
"use client"

import { Layers } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { DraftCourse } from "@/hooks/admin/useSchoolProfileDraft"

interface CourseStepProps {
  departmentId: string
  courses: DraftCourse[]
  onAdd: (departmentId: string, name: string) => void
  onRename: (courseKey: string, name: string) => void
  onDelete: (courseKey: string) => void
  disabled?: boolean
}

export function CourseStep({
  departmentId,
  courses,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: CourseStepProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium not-interactive">Courses</p>
      </div>

      {courses.length === 0 && (
        <p className="text-xs text-muted-foreground not-interactive">
          No courses yet — add the ones your school actually offers.
        </p>
      )}

      <div className="space-y-2">
        {courses.map((course) => (
          <EditableItemRow
            key={course.key}
            label={course.name}
            subtitle={course.code ?? undefined}
            disabled={disabled}
            onRename={(name) => onRename(course.key, name)}
            onDelete={() => onDelete(course.key)}
          />
        ))}
      </div>

      <AddItemInput
        placeholder="e.g. BS Information Technology"
        disabled={disabled}
        onAdd={(name) => onAdd(departmentId, name)}
      />
    </div>
  )
}
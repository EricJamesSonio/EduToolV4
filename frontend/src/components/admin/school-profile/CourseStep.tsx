"use client"

import { Layers } from "lucide-react"
import { EditableItemRow } from "./ui/EditableItemRow"
import { AddItemInput } from "./ui/AddItemInput"
import type { SchoolProfileCourse } from "@/types/admin/school-profile.types"

interface CourseStepProps {
  departmentId: string
  courses: SchoolProfileCourse[]
  onAdd: (departmentId: string, name: string) => void
  onRename: (courseId: string, name: string) => void
  onDelete: (courseId: string) => void
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
            key={course.id}
            label={course.name}
            subtitle={course.code ?? undefined}
            disabled={disabled}
            onRename={(name) => onRename(course.id, name)}
            onDelete={() => onDelete(course.id)}
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
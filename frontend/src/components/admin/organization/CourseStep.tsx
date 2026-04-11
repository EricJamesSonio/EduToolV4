import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import type { Course } from "@/types/admin/course.types"

interface CourseStepProps {
  selectedCourses: Set<string>
  availableCourses: Course[]
  onToggleCourse: (code: string) => void
  onSelectAllCourses: () => void
  onDeselectAllCourses: () => void
}

export function CourseStep({
  selectedCourses,
  availableCourses,
  onToggleCourse,
  onSelectAllCourses,
  onDeselectAllCourses,
}: CourseStepProps) {
  if (availableCourses.length === 0) return null

  const courseCodesSet = new Set(availableCourses.map((c) => c.code))
  const selectedCount = Array.from(selectedCourses).filter((c) =>
    courseCodesSet.has(c),
  ).length

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        College Courses
      </Label>
      <Collapsible
        title="Bachelor of Secondary Education (BSEd) + Other Courses"
        count={selectedCount}
        total={availableCourses.length}
        defaultOpen
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={onSelectAllCourses}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={onDeselectAllCourses}
            >
              None
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {availableCourses.map((course) => (
              <Checkbox
                key={course.code}
                checked={selectedCourses.has(course.code ?? "")}
                onChange={() => onToggleCourse(course.code ?? "")}
                label={`${course.code} - ${course.name}`}
                subtle
              />
            ))}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
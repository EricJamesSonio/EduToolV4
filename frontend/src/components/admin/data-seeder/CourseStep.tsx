import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import { COLLEGE_COURSES } from "./constants/seed-data"

interface CourseStepProps {
  selectedCourses: Set<string>
  disabledCourseCodes: Set<string>
  onToggleCourse: (code: string) => void
  onSelectAllCourses: () => void
  onDeselectAllCourses: () => void
  coursesOverride?: { code: string; name: string; years: number }[] | null
}

export function CourseStep({
  selectedCourses,
  disabledCourseCodes,
  onToggleCourse,
  onSelectAllCourses,
  onDeselectAllCourses,
  coursesOverride,
}: CourseStepProps) {
  const courses = coursesOverride ?? COLLEGE_COURSES
  const isDisabled = (code: string) => disabledCourseCodes.has(code?.trim())

  const selectedCount = courses.filter(
    (c) => selectedCourses.has(c.code ?? "") && !isDisabled(c.code ?? ""),
  ).length

  return (
    <div className="space-y-2">
      <Collapsible
        title="College Courses"
        count={selectedCount}
        total={courses.length}
        defaultOpen
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button type="button" className="text-xs text-primary hover:underline" onClick={onSelectAllCourses}>
              All
            </button>
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={onDeselectAllCourses}>
              None
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {courses.map((course) => (
              <Checkbox
                key={course.code}
                checked={selectedCourses.has(course.code ?? "")}
                onChange={() => !isDisabled(course.code ?? "") && onToggleCourse(course.code ?? "")}
                label={`${course.code} - ${course.name}`}
                subtle
                disabled={isDisabled(course.code ?? "")}
              />
            ))}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
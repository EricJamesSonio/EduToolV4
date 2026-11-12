"use client"

import { ChevronDown, School } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import { useSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import type {
  SchoolProfileDepartment,
  SchoolProfileLevel,
} from "@/types/admin/school-profile.types"

const CHIP = "rounded-md border bg-muted/40 px-2 py-0.5 text-xs"

function ChipList({ items }: { items: string[] }): React.JSX.Element {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground not-interactive">None</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={CHIP}>
          {item}
        </span>
      ))}
    </div>
  )
}

function LevelList({ levels }: { levels: SchoolProfileLevel[] }): React.JSX.Element {
  const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)

  if (sorted.length === 0) {
    return <p className="text-xs text-muted-foreground not-interactive">No levels yet.</p>
  }

  return (
    <div className="divide-y">
      {sorted.map((level) => {
        const sections = level.sections ?? []
        const subjects = level.subjects ?? []
        return (
          <div key={level.id} className="py-3 first:pt-0 last:pb-0">
            <p className="text-sm font-medium">{level.name}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground not-interactive">
                  Sections ({sections.length})
                </p>
                <ChipList
                  items={sections.map((s) => `${s.name} · ${s.capacity}`)}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground not-interactive">
                  Subjects ({subjects.length})
                </p>
                <ChipList items={subjects.map((s) => s.name)} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GroupDetails({
  name,
  code,
  levels,
}: {
  name: string
  code?: string | null
  levels: SchoolProfileLevel[]
}): React.JSX.Element {
  return (
    <details className="rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="min-w-0 text-sm font-medium">
          {name}
          {code ? <span className="ml-2 text-xs text-muted-foreground">{code}</span> : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {levels.length} {levels.length === 1 ? "level" : "levels"}
          <ChevronDown className="h-4 w-4" />
        </span>
      </summary>
      <div className="border-t px-4 py-4">
        <LevelList levels={levels} />
      </div>
    </details>
  )
}

function DepartmentContainer({
  department,
}: {
  department: SchoolProfileDepartment
}): React.JSX.Element {
  const courses = department.courses ?? []
  const strands = department.strands ?? []
  const levels = department.levels ?? []
  const sharedSubjects = department.subjects ?? []

  const allLevels = [
    ...levels,
    ...courses.flatMap((c) => c.levels ?? []),
    ...strands.flatMap((s) => s.levels ?? []),
  ]
  const sectionCount = allLevels.reduce((total, l) => total + (l.sections ?? []).length, 0)

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-6 py-4">
        <h3 className="text-base font-semibold not-interactive">
          {PROGRAM_TYPE_LABELS[department.type] ?? department.type}
        </h3>
        <p className="text-xs text-muted-foreground not-interactive">
          {allLevels.length} levels · {sectionCount} sections
        </p>
      </header>

      <div className="space-y-6 px-6 py-5">
        {courses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
              Courses
            </p>
            <div className="space-y-2">
              {courses.map((course) => (
                <GroupDetails
                  key={course.id}
                  name={course.name}
                  code={course.code}
                  levels={course.levels ?? []}
                />
              ))}
            </div>
          </div>
        )}

        {strands.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
              Strands
            </p>
            <div className="space-y-2">
              {strands.map((strand) => (
                <GroupDetails
                  key={strand.id}
                  name={strand.name}
                  levels={strand.levels ?? []}
                />
              ))}
            </div>
          </div>
        )}

        {levels.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
              Levels
            </p>
            <LevelList levels={levels} />
          </div>
        )}

        {sharedSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
              Shared subjects
            </p>
            <ChipList
              items={sharedSubjects.map((s) =>
                s.levelName ? `${s.name} (${s.levelName})` : s.name,
              )}
            />
          </div>
        )}

        {courses.length === 0 &&
          strands.length === 0 &&
          levels.length === 0 &&
          sharedSubjects.length === 0 && (
            <p className="text-xs text-muted-foreground not-interactive">
              Nothing configured for this department yet.
            </p>
          )}
      </div>
    </section>
  )
}

export function RegistrarSchoolProfileView(): React.JSX.Element {
  const { data, isLoading } = useSchoolProfile()
  const departments = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Profile"
        description="Departments, levels, sections and subjects this school offers. Only an administrator can change them."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={School}
          title="No departments configured yet"
          description="An administrator has not set up the school profile yet."
        />
      ) : (
        <div className="space-y-4">
          {departments.map((department) => (
            <DepartmentContainer key={department.id ?? department.type} department={department} />
          ))}
        </div>
      )}
    </div>
  )
}
"use client"

import { useMemo, useState } from "react"
import {
  BookOpen,
  DoorOpen,
  GraduationCap,
  Layers,
  Library,
  School,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ICON_TONES, type IconTone } from "@/lib/palette"
import { CardGrid } from "@/components/shared/CardGrid"
import {
  ListItemCardAction,
  listItemCardClass,
  listItemMetaClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import type {
  SchoolProfileDepartment,
  SchoolProfileLevel,
  SchoolProfileSubject,
} from "@/types/admin/school-profile.types"

type IconType = React.ComponentType<{ className?: string }>

const TONE_CYCLE: IconTone[] = ["blue", "green", "purple", "yellow", "pink", "orange"]

function toneAt(index: number): IconTone {
  return TONE_CYCLE[index % TONE_CYCLE.length]
}

interface ViewItem {
  key: string
  title: string
  code?: string | null
  levels: SchoolProfileLevel[]
  isLevel: boolean
}

interface ViewSection {
  label: string
  icon: IconType
  items: ViewItem[]
}

interface ActiveModal {
  title: string
  subtitle?: string
  levels?: SchoolProfileLevel[]
  shared?: SchoolProfileSubject[]
}

function sortLevels(levels: SchoolProfileLevel[]): SchoolProfileLevel[] {
  return [...levels].sort((a, b) => a.orderIndex - b.orderIndex)
}

function countStats(levels: SchoolProfileLevel[]) {
  let sections = 0
  let subjects = 0
  let seats = 0
  for (const level of levels) {
    const lvlSections = level.sections ?? []
    sections += lvlSections.length
    subjects += (level.subjects ?? []).length
    seats += lvlSections.reduce((total, s) => total + (s.capacity ?? 0), 0)
  }
  return { levels: levels.length, sections, subjects, seats }
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function buildSections(department: SchoolProfileDepartment): ViewSection[] {
  const result: ViewSection[] = []
  const courses = department.courses ?? []
  const strands = department.strands ?? []
  const levels = department.levels ?? []

  if (courses.length > 0) {
    result.push({
      label: "Courses",
      icon: GraduationCap,
      items: courses.map((course) => ({
        key: course.id,
        title: course.name,
        code: course.code,
        levels: sortLevels(course.levels ?? []),
        isLevel: false,
      })),
    })
  }

  if (strands.length > 0) {
    result.push({
      label: "Strands",
      icon: BookOpen,
      items: strands.map((strand) => ({
        key: strand.id,
        title: strand.name,
        levels: sortLevels(strand.levels ?? []),
        isLevel: false,
      })),
    })
  }

  if (levels.length > 0) {
    result.push({
      label: "Levels",
      icon: Layers,
      items: sortLevels(levels).map((level) => ({
        key: level.id,
        title: level.name,
        levels: [level],
        isLevel: true,
      })),
    })
  }

  return result
}

function IconTile({
  icon: Icon,
  tone,
  small = false,
}: {
  icon: IconType
  tone: IconTone
  small?: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        small ? "h-8 w-8" : "h-10 w-10 sm:h-12 sm:w-12",
        ICON_TONES[tone],
      )}
    >
      <Icon className={small ? "h-4 w-4" : "h-5 w-5"} />
    </div>
  )
}

function MetaRow({
  icon: Icon,
  children,
}: {
  icon: IconType
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <p className={cn(listItemMetaClass, "flex items-center gap-2")}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </p>
  )
}

function SubjectChip({ subject }: { subject: SchoolProfileSubject }): React.JSX.Element {
  const isMinor = subject.subjectType === "minor"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
        isMinor ? "border-dashed bg-muted/30" : "bg-primary/5",
      )}
    >
      {subject.name}
      {isMinor ? (
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">minor</span>
      ) : null}
    </span>
  )
}

function ItemCard({
  item,
  icon,
  tone,
  fallbackSubtitle,
  onView,
}: {
  item: ViewItem
  icon: IconType
  tone: IconTone
  fallbackSubtitle: string
  onView: () => void
}): React.JSX.Element {
  const stats = countStats(item.levels)
  return (
    <div className={cn(listItemCardClass, "flex flex-col justify-between")}>
      <div className="flex items-start gap-3">
        <IconTile icon={icon} tone={tone} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 className={cn(listItemTitleClass, "line-clamp-2")}>{item.title}</h4>
          <p className={cn(listItemMetaClass, "truncate")}>{item.code ?? fallbackSubtitle}</p>
        </div>
        {!item.isLevel && (
          <Badge variant="outline" className="mt-0.5 shrink-0">
            {plural(stats.levels, "lvl")}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        <MetaRow icon={DoorOpen}>{plural(stats.sections, "section")}</MetaRow>
        <MetaRow icon={BookOpen}>{plural(stats.subjects, "subject")}</MetaRow>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className={cn(listItemMetaClass, "flex items-center gap-1.5")}>
          <Users className="h-3.5 w-3.5" />
          {stats.seats} seats
        </span>
        <ListItemCardAction icon={Layers} label="View" onClick={onView} />
      </div>
    </div>
  )
}

function SharedSubjectsCard({
  subjects,
  onView,
}: {
  subjects: SchoolProfileSubject[]
  onView: () => void
}): React.JSX.Element {
  return (
    <div className={cn(listItemCardClass, "flex flex-col justify-between")}>
      <div className="flex items-start gap-3">
        <IconTile icon={Library} tone="yellow" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 className={cn(listItemTitleClass, "line-clamp-2")}>Shared subjects</h4>
          <p className={cn(listItemMetaClass, "truncate")}>Across courses and strands</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <MetaRow icon={BookOpen}>{plural(subjects.length, "subject")}</MetaRow>
      </div>

      <div className="flex items-center justify-end">
        <ListItemCardAction icon={Layers} label="View" onClick={onView} />
      </div>
    </div>
  )
}

function SectionBlock({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: IconType
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
          {label}
        </p>
      </div>
      <CardGrid>{children}</CardGrid>
    </div>
  )
}

function DepartmentContainer({
  department,
  onOpen,
}: {
  department: SchoolProfileDepartment
  onOpen: (modal: ActiveModal) => void
}): React.JSX.Element {
  const label = PROGRAM_TYPE_LABELS[department.type] ?? department.type
  const sections = useMemo(() => buildSections(department), [department])
  const sharedSubjects = department.subjects ?? []

  const allLevels = [
    ...(department.levels ?? []),
    ...(department.courses ?? []).flatMap((c) => c.levels ?? []),
    ...(department.strands ?? []).flatMap((s) => s.levels ?? []),
  ]
  const totals = countStats(allLevels)
  const isEmpty = sections.length === 0 && sharedSubjects.length === 0

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight not-interactive">{label}</h3>
          <p className={cn(listItemMetaClass, "not-interactive")}>
            {plural(totals.levels, "level")} · {plural(totals.sections, "section")} ·{" "}
            {plural(totals.subjects, "subject")}
          </p>
        </div>
        <Badge variant="outline">{totals.seats} seats</Badge>
      </header>

      <div className="space-y-6 px-6 py-5">
        {sections.map((section) => (
          <SectionBlock key={section.label} label={section.label} icon={section.icon}>
            {section.items.map((item, index) => (
              <ItemCard
                key={item.key}
                item={item}
                icon={section.icon}
                tone={toneAt(index)}
                fallbackSubtitle={label}
                onView={() =>
                  onOpen({
                    title: item.title,
                    subtitle: item.code ?? `${label} · ${section.label.replace(/s$/, "")}`,
                    levels: item.levels,
                  })
                }
              />
            ))}
          </SectionBlock>
        ))}

        {sharedSubjects.length > 0 && (
          <SectionBlock label="Shared subjects" icon={Library}>
            <SharedSubjectsCard
              subjects={sharedSubjects}
              onView={() =>
                onOpen({
                  title: "Shared subjects",
                  subtitle: label,
                  shared: sharedSubjects,
                })
              }
            />
          </SectionBlock>
        )}

        {isEmpty && (
          <p className="text-xs text-muted-foreground not-interactive">
            Nothing configured for this department yet.
          </p>
        )}
      </div>
    </section>
  )
}

function LevelDetail({
  level,
  tone,
}: {
  level: SchoolProfileLevel
  tone: IconTone
}): React.JSX.Element {
  const sections = level.sections ?? []
  const subjects = level.subjects ?? []
  const majors = subjects.filter((s) => s.subjectType !== "minor")
  const minors = subjects.filter((s) => s.subjectType === "minor")
  const seats = sections.reduce((total, s) => total + (s.capacity ?? 0), 0)

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <IconTile icon={Layers} tone={tone} small />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight not-interactive">{level.name}</p>
          <p className="text-xs text-muted-foreground not-interactive">
            {plural(sections.length, "section")} · {plural(subjects.length, "subject")}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          <Users />
          {seats}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground not-interactive">
            <DoorOpen className="h-3.5 w-3.5" />
            Sections ({sections.length})
          </p>
          {sections.length === 0 ? (
            <p className="text-xs text-muted-foreground not-interactive">No sections.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sections.map((section) => (
                <span
                  key={section.id}
                  className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs"
                >
                  {section.name}
                  <span className="ml-1.5 text-muted-foreground">{section.capacity}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground not-interactive">
            <BookOpen className="h-3.5 w-3.5" />
            Subjects ({subjects.length})
          </p>
          {subjects.length === 0 ? (
            <p className="text-xs text-muted-foreground not-interactive">No subjects.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {[...majors, ...minors].map((subject) => (
                <SubjectChip key={subject.id} subject={subject} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SharedDetail({ subjects }: { subjects: SchoolProfileSubject[] }): React.JSX.Element {
  const groups = new Map<string, SchoolProfileSubject[]>()
  for (const subject of subjects) {
    const key = subject.levelName ?? "All levels"
    groups.set(key, [...(groups.get(key) ?? []), subject])
  }

  return (
    <div className="space-y-3">
      {Array.from(groups.entries()).map(([levelName, items], index) => (
        <div key={levelName} className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <IconTile icon={Layers} tone={toneAt(index)} small />
            <p className="text-sm font-semibold not-interactive">{levelName}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((subject) => (
              <SubjectChip key={subject.id} subject={subject} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SchoolProfileReadOnlyView({
  departments,
}: {
  departments: SchoolProfileDepartment[]
}): React.JSX.Element {
  const [active, setActive] = useState<ActiveModal | null>(null)

  if (departments.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed p-6">
        <IconTile icon={School} tone="blue" />
        <p className="text-sm text-muted-foreground not-interactive">
          No departments configured yet.
        </p>
      </div>
    )
  }

  const activeLevels = active?.levels ? sortLevels(active.levels) : []
  const activeStats = countStats(activeLevels)

  return (
    <div className="space-y-4">
      {departments.map((department) => (
        <DepartmentContainer
          key={department.id ?? department.type}
          department={department}
          onOpen={setActive}
        />
      ))}

      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setActive(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{active?.title}</DialogTitle>
            {active?.subtitle ? <DialogDescription>{active.subtitle}</DialogDescription> : null}
          </DialogHeader>

          {active?.levels ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">
                  <Layers />
                  {plural(activeStats.levels, "level")}
                </Badge>
                <Badge variant="outline">
                  <DoorOpen />
                  {plural(activeStats.sections, "section")}
                </Badge>
                <Badge variant="outline">
                  <BookOpen />
                  {plural(activeStats.subjects, "subject")}
                </Badge>
                <Badge variant="outline">
                  <Users />
                  {activeStats.seats} seats
                </Badge>
              </div>
              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {activeLevels.length === 0 ? (
                  <p className="text-xs text-muted-foreground not-interactive">
                    No levels configured yet.
                  </p>
                ) : (
                  activeLevels.map((level, index) => (
                    <LevelDetail key={level.id} level={level} tone={toneAt(index)} />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {active?.shared ? (
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <SharedDetail subjects={active.shared} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
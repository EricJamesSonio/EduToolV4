"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Minus, Plus, Pencil, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { COLLEGE_COURSES, LEVEL_DEFS, PROGRAMS, SECTION_DEFAULTS, SHS_STRANDS, getDefaultLevelNames } from "./constants/seed-data"
import type { SectionConfig } from "./hooks/useSeedState"
import { Checkbox } from "./ui/Checkbox"

interface SectionStepProps {
  selectedPrograms: Set<string>
  selectedCourses?: Set<string>
  selectedStrands?: Set<string>
  levelConfigs:     Record<string, { count: number; names: string[] }>
  sectionConfigs:   Record<string, SectionConfig>
  onSetSections:    (levelName: string, sections: SectionConfig) => void
  coursesOverride?: { code: string; name: string; years: number }[] | null
  strandsOverride?: string[] | null
  levelDefsOverride?: Record<string, string[]>
  sectionsOverride?: Record<string, { name: string; capacity: number }[]>
  readOnly?: boolean
  selectedLevelKeys?: Set<string>
  selectedSectionKeys?: Set<string>
  onToggleSection?: (sectionKey: string) => void
  toLevelKey?: (entityKey: string, levelName: string) => string
  toSectionKey?: (levelKey: string, sectionName: string) => string
}

function getLevelEntities(
  prog: string,
  courses: Set<string>,
  strands: Set<string>,
  coursesOverride?: { code: string; name: string; years: number }[] | null,
  strandsOverride?: string[] | null,
): { key: string; label: string }[] {
  if (prog === "college" && courses.size > 0) {
    const list = coursesOverride ?? COLLEGE_COURSES
    return Array.from(courses).map((code) => {
      const c = list.find((cc) => cc.code === code)
      return { key: code, label: c?.name ?? code }
    })
  }
  if (prog === "shs" && strands.size > 0) {
    const list = strandsOverride ?? SHS_STRANDS
    return Array.from(strands)
      .filter((name) => list.includes(name))
      .map((name) => ({ key: name, label: name }))
  }
  const p = PROGRAMS.find((pp) => pp.key === prog)
  return [{ key: prog, label: p?.label ?? prog }]
}

function entityLabel(entityKey: string, coursesOverride?: { code: string; name: string; years: number }[] | null): string {
  const prog = PROGRAMS.find((p) => p.key === entityKey)
  if (prog) return prog.label
  const course = (coursesOverride ?? COLLEGE_COURSES).find((c) => c.code === entityKey)
  if (course) return course.name
  return entityKey
}

function SectionRow({
  section, isOnly, onRename, onChangeCapacity, onRemove, onReset, defaultSection, readOnly = false,
}: {
  section: { name: string; capacity: number }
  isOnly: boolean
  onRename: (name: string) => void
  onChangeCapacity: (cap: number) => void
  onRemove: () => void
  onReset: () => void
  defaultSection: { name: string; capacity: number } | undefined
  readOnly?: boolean
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(section.name)

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed) onRename(trimmed)
    else setNameValue(section.name)
    setEditingName(false)
  }

  const isDefault = defaultSection && section.name === defaultSection.name && section.capacity === defaultSection.capacity

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 group">
      <div className="flex-1 min-w-0">
        {editingName ? (
          <Input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName()
              if (e.key === "Escape") { setNameValue(section.name); setEditingName(false) }
            }}
            className="h-6 text-xs px-1 border-0 shadow-none focus-visible:ring-0 p-0"
          />
        ) : (
          <span className="text-xs font-medium truncate block not-interactive">{section.name}</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground not-interactive">Cap:</span>
        <Input
          type="number"
          min={1}
          max={999}
          value={section.capacity}
          disabled={readOnly}
          readOnly={readOnly}
          onChange={(e) => {
            if (readOnly) return
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v > 0) onChangeCapacity(v)
          }}
          className="h-6 w-14 text-xs px-1 text-center tabular-nums"
        />
      </div>
      {!readOnly && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!editingName && (
            <button type="button" onClick={() => { setNameValue(section.name); setEditingName(true) }} className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Rename">
              <Pencil className="h-2.5 w-2.5" />
            </button>
          )}
          {!isDefault && defaultSection && (
            <button type="button" onClick={onReset} className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Reset to default">
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={isOnly}
            className={cn("p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors", "disabled:opacity-30 disabled:cursor-not-allowed")}
            title="Remove section"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function LevelSectionsPanel({
  levelName, sections, onSetSections, defaults, readOnly = false, levelKey, selectedSectionKeys, onToggleSection, toSectionKey,
}: {
  levelName: string
  sections: SectionConfig
  onSetSections: (sections: SectionConfig) => void
  defaults: { name: string; capacity: number }[]
  readOnly?: boolean
  levelKey?: string
  selectedSectionKeys?: Set<string>
  onToggleSection?: (sectionKey: string) => void
  toSectionKey?: (levelKey: string, sectionName: string) => string
}) {
  function addSection() {
    const next = sections.length + 1
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const name = `Section ${letters[next - 1] ?? next}`
    onSetSections([...sections, { name, capacity: 40 }])
  }
  function removeAt(i: number) {
    if (sections.length <= 1) return
    onSetSections(sections.filter((_, idx) => idx !== i))
  }
  function renameAt(i: number, name: string) {
    const next = [...sections]; next[i] = { ...next[i], name }; onSetSections(next)
  }
  function setCapacityAt(i: number, capacity: number) {
    const next = [...sections]; next[i] = { ...next[i], capacity }; onSetSections(next)
  }
  function resetAt(i: number) {
    const def = defaults[i]
    if (!def) return
    const next = [...sections]; next[i] = { ...def }; onSetSections(next)
  }

  if (readOnly) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground not-interactive">{levelName}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{sections.length} section(s)</span>
        </div>
        <div className="space-y-1">
          {sections.map((sec) => {
            const sectionKey = toSectionKey && levelKey ? toSectionKey(levelKey, sec.name) : `${levelKey ?? levelName}::${sec.name}`
            const checked = selectedSectionKeys?.has(sectionKey) ?? true
            return (
              <div key={sectionKey} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                <Checkbox checked={checked} onChange={() => onToggleSection?.(sectionKey)} label={`${sec.name} (cap ${sec.capacity})`} subtle />
              </div>
            )
          })}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => sections.forEach((sec) => {
              const k = toSectionKey && levelKey ? toSectionKey(levelKey, sec.name) : `${levelKey ?? levelName}::${sec.name}`
              if (!selectedSectionKeys?.has(k)) onToggleSection?.(k)
            })}
          >
            All
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => sections.forEach((sec) => {
              const k = toSectionKey && levelKey ? toSectionKey(levelKey, sec.name) : `${levelKey ?? levelName}::${sec.name}`
              if (selectedSectionKeys?.has(k)) onToggleSection?.(k)
            })}
          >
            None
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground not-interactive">{levelName}</span>
        <button type="button" onClick={addSection} className={cn("flex items-center gap-1 text-xs text-muted-foreground rounded px-1.5 py-0.5", "hover:bg-muted/60 hover:text-foreground transition-colors border")}>
          <Plus className="h-3 w-3" />
          Add section
        </button>
      </div>
      <div className="space-y-1">
        {sections.map((sec, i) => (
          <SectionRow
            key={i}
            section={sec}
            isOnly={sections.length === 1}
            defaultSection={defaults[i]}
            readOnly={readOnly}
            onRename={(name) => renameAt(i, name)}
            onChangeCapacity={(cap) => setCapacityAt(i, cap)}
            onRemove={() => removeAt(i)}
            onReset={() => resetAt(i)}
          />
        ))}
      </div>
    </div>
  )
}

function EntitySectionsPanel({
  entityKey, levelNames, sectionConfigs, onSetSections, coursesOverride, sectionsOverride, readOnly = false, selectedSectionKeys, onToggleSection, toLevelKey, toSectionKey,
}: {
  entityKey: string
  levelNames: string[]
  sectionConfigs: Record<string, SectionConfig>
  onSetSections: (levelName: string, sections: SectionConfig) => void
  coursesOverride?: { code: string; name: string; years: number }[] | null
  sectionsOverride?: Record<string, { name: string; capacity: number }[]>
  readOnly?: boolean
  selectedSectionKeys?: Set<string>
  onToggleSection?: (sectionKey: string) => void
  toLevelKey?: (entityKey: string, levelName: string) => string
  toSectionKey?: (levelKey: string, sectionName: string) => string
}) {
  const [open, setOpen] = useState(true)
  const label = entityLabel(entityKey, coursesOverride)

  const defaultsFor = (levelName: string) => sectionsOverride?.[levelName] ?? SECTION_DEFAULTS

  const totalSections = levelNames.reduce((sum, lvl) => sum + (sectionConfigs[lvl]?.length ?? defaultsFor(lvl).length), 0)

  return (
    <div className="rounded-lg border overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{totalSections} section(s) across {levelNames.length} level(s)</span>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-4">
          <p className="text-xs text-muted-foreground not-interactive">
            {readOnly
              ? "Sections from your School Profile preset."
              : "Each level gets its own sections. Click pencil to rename, edit cap directly, or use + / − to add or remove sections per level."}
          </p>
          {levelNames.map((levelName) => {
            const levelKey = toLevelKey ? toLevelKey(entityKey, levelName) : `${entityKey}::${levelName}`
            return (
              <LevelSectionsPanel
                key={levelName}
                levelName={levelName}
                levelKey={levelKey}
                sections={sectionConfigs[levelName] ?? defaultsFor(levelName)}
                defaults={defaultsFor(levelName)}
                readOnly={readOnly}
                selectedSectionKeys={selectedSectionKeys}
                onToggleSection={onToggleSection}
                toSectionKey={toSectionKey}
                onSetSections={(sections) => onSetSections(levelName, sections)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SectionStep({
  selectedPrograms,
  selectedCourses = new Set(),
  selectedStrands = new Set(),
  levelConfigs,
  sectionConfigs,
  onSetSections,
  coursesOverride,
  strandsOverride,
  levelDefsOverride,
  sectionsOverride,
  readOnly = false,
  selectedLevelKeys,
  selectedSectionKeys,
  onToggleSection,
  toLevelKey,
  toSectionKey,
}: SectionStepProps) {
  const programsWithLevels = Array.from(selectedPrograms).filter((p) => LEVEL_DEFS[p] || levelDefsOverride?.[p])
  if (programsWithLevels.length === 0) return null

  const entities = programsWithLevels.flatMap((prog) =>
    getLevelEntities(prog, selectedCourses, selectedStrands, coursesOverride, strandsOverride),
  )

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {entities.map(({ key }) => {
          const rawLevelNames = levelConfigs[key]?.names ?? levelDefsOverride?.[key] ?? getDefaultLevelNames(key)
          const levelNames = readOnly && selectedLevelKeys && selectedLevelKeys.size > 0
            ? rawLevelNames.filter((lvl) => {
                const lk = toLevelKey ? toLevelKey(key, lvl) : `${key}::${lvl}`
                return selectedLevelKeys.has(lk)
              })
            : rawLevelNames
          return (
            <EntitySectionsPanel
              key={key}
              entityKey={key}
              levelNames={levelNames}
              sectionConfigs={sectionConfigs}
              onSetSections={onSetSections}
              coursesOverride={coursesOverride}
              sectionsOverride={sectionsOverride}
              readOnly={readOnly}
              selectedSectionKeys={selectedSectionKeys}
              onToggleSection={onToggleSection}
              toLevelKey={toLevelKey}
              toSectionKey={toSectionKey}
            />
          )
        })}
      </div>
    </div>
  )
}
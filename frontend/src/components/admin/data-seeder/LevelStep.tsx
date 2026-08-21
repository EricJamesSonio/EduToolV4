"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Minus, Pencil, Plus, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { COLLEGE_COURSES, LEVEL_DEFS, LEVEL_MAX, LEVEL_MIN, PROGRAMS, SHS_STRANDS, generateLevelNames, getDefaultLevelNames } from "./constants/seed-data"
import type { ProgramLevelConfig } from "./hooks/useSeedState"

interface LevelStepProps {
  selectedPrograms:   Set<string>
  selectedCourses?:   Set<string>
  selectedStrands?:   Set<string>
  disabledLevelNames: Set<string>
  levelConfigs:       Record<string, ProgramLevelConfig>
  onSetCount:         (prog: string, count: number) => void
  onRenameAt:         (prog: string, index: number, name: string) => void
  coursesOverride?:   { code: string; name: string; years: number }[] | null
  strandsOverride?:   string[] | null
  levelDefsOverride?: Record<string, string[]>
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

function CountStepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}
        className={cn("flex h-7 w-7 items-center justify-center rounded border text-muted-foreground transition-colors", "hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed")}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums not-interactive">{value}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}
        className={cn("flex h-7 w-7 items-center justify-center rounded border text-muted-foreground transition-colors", "hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed")}>
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

function entityMinMax(
  entityKey: string,
  coursesOverride?: { code: string; name: string; years: number }[] | null,
  levelDefsOverride?: Record<string, string[]>,
): { min: number; max: number } {
  if (LEVEL_MIN[entityKey] !== undefined) {
    const overrideLen = levelDefsOverride?.[entityKey]?.length
    return { min: LEVEL_MIN[entityKey], max: Math.max(LEVEL_MAX[entityKey] ?? 12, overrideLen ?? 0) }
  }
  const course = (coursesOverride ?? COLLEGE_COURSES).find((c) => c.code === entityKey)
  if (course) return { min: 1, max: course.years }
  if (SHS_STRANDS.includes(entityKey) || levelDefsOverride?.[entityKey]) {
    const overrideLen = levelDefsOverride?.[entityKey]?.length
    return { min: 1, max: Math.max(2, overrideLen ?? 0) }
  }
  return { min: 1, max: 12 }
}

function entityLabel(entityKey: string, coursesOverride?: { code: string; name: string; years: number }[] | null): string {
  const prog = PROGRAMS.find((p) => p.key === entityKey)
  if (prog) return prog.label
  const course = (coursesOverride ?? COLLEGE_COURSES).find((c) => c.code === entityKey)
  if (course) return course.name
  return entityKey
}

function ProgramLevelsPanel({
  prog,
  config,
  onSetCount,
  onRenameAt,
  coursesOverride,
  levelDefsOverride,
}: {
  prog: string
  config: ProgramLevelConfig
  onSetCount: (count: number) => void
  onRenameAt: (index: number, name: string) => void
  coursesOverride?: { code: string; name: string; years: number }[] | null
  levelDefsOverride?: Record<string, string[]>
}) {
  const [open, setOpen] = useState(true)
  const [editingIndex, setEditing] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const { min, max } = entityMinMax(prog, coursesOverride, levelDefsOverride)
  const label = entityLabel(prog, coursesOverride)
  const overrideNames = levelDefsOverride?.[prog]

  function startEdit(i: number) {
    setEditing(i)
    setEditValue(config.names[i])
  }

  function commitEdit(i: number) {
    const trimmed = editValue.trim()
    if (trimmed) onRenameAt(i, trimmed)
    setEditing(null)
  }

  function defaultNameAt(i: number): string {
    if (overrideNames?.[i]) return overrideNames[i]
    const defaults = getDefaultLevelNames(prog)
    return defaults[i] ?? generateLevelNames(prog, config.count)[i]
  }

  function resetName(i: number) {
    onRenameAt(i, defaultNameAt(i))
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <span className="text-sm font-medium">{label}</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground not-interactive">Levels:</span>
          <CountStepper value={config.count} min={min} max={max} onChange={onSetCount} />
          <Badge variant="secondary" className="text-xs tabular-nums">{config.count}</Badge>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-3 not-interactive">
            Click the <Pencil className="inline h-3 w-3" /> icon to rename a level. Use + / − to add or remove levels.
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {config.names.map((name, i) => (
              <div key={i} className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 group">
                {editingIndex === i ? (
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(i)
                      if (e.key === "Escape") setEditing(null)
                    }}
                    className="h-6 text-xs px-1 border-0 shadow-none focus-visible:ring-0 p-0"
                  />
                ) : (
                  <span className="flex-1 text-xs font-medium truncate not-interactive">{name}</span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingIndex !== i && (
                    <>
                      <button type="button" onClick={() => startEdit(i)} className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Rename">
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      {name !== defaultNameAt(i) && (
                        <button type="button" onClick={() => resetName(i)} className="p-0.5 rounded text-muted-foreground hover:text-foreground" title="Reset to default">
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LevelStep({
  selectedPrograms,
  selectedCourses = new Set(),
  selectedStrands = new Set(),
  levelConfigs,
  onSetCount,
  onRenameAt,
  coursesOverride,
  strandsOverride,
  levelDefsOverride,
}: LevelStepProps) {
  const programsWithLevels = Array.from(selectedPrograms).filter((p) => LEVEL_DEFS[p] || levelDefsOverride?.[p])
  if (programsWithLevels.length === 0) return null

  const entities = programsWithLevels.flatMap((prog) =>
    getLevelEntities(prog, selectedCourses, selectedStrands, coursesOverride, strandsOverride),
  )

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {entities.map(({ key }) => {
          const overrideNames = levelDefsOverride?.[key]
          const config =
            levelConfigs[key] ??
            (() => {
              const defaults = overrideNames ?? getDefaultLevelNames(key)
              return { count: defaults.length, names: defaults }
            })()
          return (
            <ProgramLevelsPanel
              key={key}
              prog={key}
              config={config}
              onSetCount={(count) => onSetCount(key, count)}
              onRenameAt={(i, name) => onRenameAt(key, i, name)}
              coursesOverride={coursesOverride}
              levelDefsOverride={levelDefsOverride}
            />
          )
        })}
      </div>
    </div>
  )
}
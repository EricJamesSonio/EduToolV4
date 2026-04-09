"use client"

import { useState } from "react"
import { LayoutList, ChevronDown, ChevronRight, Minus, Plus, Pencil, RotateCcw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LEVEL_DEFS, PROGRAMS, SECTION_DEFAULTS } from "./constants/seed-data"
import type { SectionConfig } from "./hooks/useSeedState"

interface SectionStepProps {
  selectedPrograms: Set<string>
  levelConfigs:     Record<string, { count: number; names: string[] }>
  sectionConfigs:   Record<string, SectionConfig>
  onSetSections:    (levelName: string, sections: SectionConfig) => void
}

// ── Per-level section row ────────────────────────────────────────────────────

function SectionRow({
  section,
  index,
  isOnly,
  onRename,
  onChangeCapacity,
  onRemove,
  onReset,
  defaultSection,
}: {
  section:          { name: string; capacity: number }
  index:            number
  isOnly:           boolean
  onRename:         (name: string) => void
  onChangeCapacity: (cap: number) => void
  onRemove:         () => void
  onReset:          () => void
  defaultSection:   { name: string; capacity: number } | undefined
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState(section.name)

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed) onRename(trimmed)
    else setNameValue(section.name) // revert if empty
    setEditingName(false)
  }

  const isDefault =
    defaultSection &&
    section.name === defaultSection.name &&
    section.capacity === defaultSection.capacity

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 group">
      {/* Name */}
      <div className="flex-1 min-w-0">
        {editingName ? (
          <Input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter")  commitName()
              if (e.key === "Escape") { setNameValue(section.name); setEditingName(false) }
            }}
            className="h-6 text-xs px-1 border-0 shadow-none focus-visible:ring-0 p-0"
          />
        ) : (
          <span className="text-xs font-medium truncate block">{section.name}</span>
        )}
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground">Cap:</span>
        <Input
          type="number"
          min={1}
          max={999}
          value={section.capacity}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v) && v > 0) onChangeCapacity(v)
          }}
          className="h-6 w-14 text-xs px-1 text-center tabular-nums"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!editingName && (
          <button
            type="button"
            onClick={() => { setNameValue(section.name); setEditingName(true) }}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground"
            title="Rename"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
        )}
        {!isDefault && defaultSection && (
          <button
            type="button"
            onClick={onReset}
            className="p-0.5 rounded text-muted-foreground hover:text-foreground"
            title="Reset to default"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={isOnly}
          className={cn(
            "p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors",
            "disabled:opacity-30 disabled:cursor-not-allowed",
          )}
          title="Remove section"
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  )
}

// ── Per-level panel ──────────────────────────────────────────────────────────

function LevelSectionsPanel({
  levelName,
  sections,
  onSetSections,
}: {
  levelName:    string
  sections:     SectionConfig
  onSetSections: (sections: SectionConfig) => void
}) {
  const defaults = SECTION_DEFAULTS

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
    const next = [...sections]
    next[i] = { ...next[i], name }
    onSetSections(next)
  }

  function setCapacityAt(i: number, capacity: number) {
    const next = [...sections]
    next[i] = { ...next[i], capacity }
    onSetSections(next)
  }

  function resetAt(i: number) {
    const def = defaults[i]
    if (!def) return
    const next = [...sections]
    next[i] = { ...def }
    onSetSections(next)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{levelName}</span>
        <button
          type="button"
          onClick={addSection}
          className={cn(
            "flex items-center gap-1 text-xs text-muted-foreground rounded px-1.5 py-0.5",
            "hover:bg-muted/60 hover:text-foreground transition-colors border",
          )}
        >
          <Plus className="h-3 w-3" />
          Add section
        </button>
      </div>

      <div className="space-y-1">
        {sections.map((sec, i) => (
          <SectionRow
            key={i}
            section={sec}
            index={i}
            isOnly={sections.length === 1}
            defaultSection={defaults[i]}
            onRename={(name)    => renameAt(i, name)}
            onChangeCapacity={(cap) => setCapacityAt(i, cap)}
            onRemove={() => removeAt(i)}
            onReset={() => resetAt(i)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Per-program collapsible panel ────────────────────────────────────────────

function ProgramSectionsPanel({
  prog,
  levelNames,
  sectionConfigs,
  onSetSections,
}: {
  prog:          string
  levelNames:    string[]
  sectionConfigs: Record<string, SectionConfig>
  onSetSections: (levelName: string, sections: SectionConfig) => void
}) {
  const [open, setOpen] = useState(true)
  const label = PROGRAMS.find((p) => p.key === prog)?.label ?? prog

  const totalSections = levelNames.reduce(
    (sum, lvl) => sum + (sectionConfigs[lvl]?.length ?? SECTION_DEFAULTS.length),
    0,
  )

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 text-left"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          }
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {totalSections} section(s) across {levelNames.length} level(s)
        </span>
      </button>

      {/* Per-level section lists */}
      {open && (
        <div className="px-4 py-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            Each level gets its own sections. Click <Pencil className="inline h-3 w-3" /> to rename,
            edit the cap number directly, or use + / − to add or remove sections per level.
          </p>
          {levelNames.map((levelName) => (
            <LevelSectionsPanel
              key={levelName}
              levelName={levelName}
              sections={sectionConfigs[levelName] ?? SECTION_DEFAULTS}
              onSetSections={(sections) => onSetSections(levelName, sections)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────

export function SectionStep({
  selectedPrograms,
  levelConfigs,
  sectionConfigs,
  onSetSections,
}: SectionStepProps) {
  const programsWithLevels = Array.from(selectedPrograms).filter((p) => LEVEL_DEFS[p])
  if (programsWithLevels.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <LayoutList className="h-3.5 w-3.5" />
        Sections
      </Label>
      <div className="space-y-2">
        {programsWithLevels.map((prog) => {
          const levelNames = levelConfigs[prog]?.names ?? LEVEL_DEFS[prog] ?? []
          return (
            <ProgramSectionsPanel
              key={prog}
              prog={prog}
              levelNames={levelNames}
              sectionConfigs={sectionConfigs}
              onSetSections={onSetSections}
            />
          )
        })}
      </div>
    </div>
  )
}
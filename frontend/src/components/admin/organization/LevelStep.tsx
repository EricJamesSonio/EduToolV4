// frontend/src/components/admin/organization/LevelStep.tsx
"use client"

import { useState } from "react"
import { BookOpen, ChevronDown, ChevronRight, Minus, Pencil, Plus, RotateCcw } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { LEVEL_DEFS, LEVEL_MAX, LEVEL_MIN, PROGRAMS, generateLevelNames } from "./constants/seed-data"
import type { ProgramLevelConfig } from "./hooks/useSeedState"

interface LevelStepProps {
  selectedPrograms:   Set<string>
  disabledLevelNames: Set<string>
  levelConfigs:       Record<string, ProgramLevelConfig>
  onSetCount:         (prog: string, count: number) => void
  onRenameAt:         (prog: string, index: number, name: string) => void
}
function CountStepper({
  value,
  min,
  max,
  onChange,
}: {
  value:    number
  min:      number
  max:      number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded border text-muted-foreground transition-colors",
          "hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed"
        )}
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded border text-muted-foreground transition-colors",
          "hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed"
        )}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

function ProgramLevelsPanel({
  prog,
  config,
  onSetCount,
  onRenameAt,
}: {
  prog:       string
  config:     ProgramLevelConfig
  onSetCount: (count: number) => void
  onRenameAt: (index: number, name: string) => void
}) {
  const [open, setOpen]             = useState(true)
  const [editingIndex, setEditing]  = useState<number | null>(null)
  const [editValue, setEditValue]   = useState("")
  const min = LEVEL_MIN[prog] ?? 1
  const max = LEVEL_MAX[prog] ?? 12
  const label = PROGRAMS.find((p) => p.key === prog)?.label ?? prog

  function startEdit(i: number) {
    setEditing(i)
    setEditValue(config.names[i])
  }

  function commitEdit(i: number) {
    const trimmed = editValue.trim()
    if (trimmed) onRenameAt(i, trimmed)
    setEditing(null)
  }

  function resetName(i: number) {
    const defaultName = generateLevelNames(prog, config.count)[i]
    onRenameAt(i, defaultName)
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {open
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          }
          <span className="text-sm font-medium">{label}</span>
        </button>

        {/* Count stepper always visible in header */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Levels:</span>
          <CountStepper
            value={config.count}
            min={min}
            max={max}
            onChange={onSetCount}
          />
          <Badge variant="secondary" className="text-xs tabular-nums">
            {config.count}
          </Badge>
        </div>
      </div>

      {/* Level names grid */}
      {open && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-3">
            Click the <Pencil className="inline h-3 w-3" /> icon to rename a level. Use + / − to add or remove levels.
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {config.names.map((name, i) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded-md border bg-background px-2 py-1.5 group"
              >
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
                  <span className="flex-1 text-xs font-medium truncate">{name}</span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingIndex !== i && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(i)}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </button>
                      {/* Show reset only if name differs from default */}
                      {name !== generateLevelNames(prog, config.count)[i] && (
                        <button
                          type="button"
                          onClick={() => resetName(i)}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                          title="Reset to default"
                        >
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
  levelConfigs,
  onSetCount,
  onRenameAt,
}: LevelStepProps) {
  const programsWithLevels = Array.from(selectedPrograms).filter((p) => LEVEL_DEFS[p])
  if (programsWithLevels.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Levels
      </Label>
      <div className="space-y-2">
        {programsWithLevels.map((prog) => (
          <ProgramLevelsPanel
            key={prog}
            prog={prog}
            config={levelConfigs[prog] ?? { count: LEVEL_DEFS[prog].length, names: LEVEL_DEFS[prog] }}
            onSetCount={(count) => onSetCount(prog, count)}
            onRenameAt={(i, name) => onRenameAt(prog, i, name)}
          />
        ))}
      </div>
    </div>
  )
}
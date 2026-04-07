// frontend/src/components/admin/organization/GradingScaleStep.tsx
"use client"

import { useState } from "react"
import { BarChart3, Check, ChevronDown, ChevronRight } from "lucide-react"
import { Badge }  from "@/components/ui/badge"
import { Label }  from "@/components/ui/label"
import { cn }     from "@/lib/utils"
import { GRADING_SCALE_PRESETS, PROGRAMS, type GradingScalePreset } from "./constants/seed-data"

interface GradingScaleStepProps {
  selectedPrograms:        Set<string>
  seedGradingScale:        boolean
  gradingScaleByProgram:   Record<string, string>       // prog → presetKey
  onToggleSeed:            (v: boolean) => void
  onSelectPreset:          (prog: string, presetKey: string) => void
}

// Collapsible range preview table for a preset
function RangePreview({ preset }: { preset: GradingScalePreset }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
      >
        <span>Preview ranges ({preset.ranges.length})</span>
        {open
          ? <ChevronDown  className="h-3.5 w-3.5" />
          : <ChevronRight className="h-3.5 w-3.5" />
        }
      </button>
      {open && (
        <div className="divide-y">
          {preset.ranges.map((range, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                  {range.gradeValue}
                </Badge>
                <span className="text-muted-foreground">{range.label}</span>
              </div>
              <span className="font-mono text-muted-foreground tabular-nums">
                {range.minScore}–{range.maxScore}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Per-program preset selector panel
function ProgramScalePanel({
  prog,
  selectedPresetKey,
  onSelect,
}: {
  prog:             string
  selectedPresetKey: string
  onSelect:          (presetKey: string) => void
}) {
  const [open, setOpen] = useState(true)
  const label    = PROGRAMS.find((p) => p.key === prog)?.label ?? prog
  const selected = GRADING_SCALE_PRESETS.find((p) => p.key === selectedPresetKey)

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {selected && (
            <Badge variant="outline" className="text-xs font-normal">
              {selected.name}
            </Badge>
          )}
          {open
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Preset grid */}
      {open && (
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GRADING_SCALE_PRESETS.map((preset) => {
              const isSelected = selectedPresetKey === preset.key
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onSelect(preset.key)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{preset.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {preset.ranges.length} grade {preset.ranges.length === 1 ? "range" : "ranges"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Range preview for the currently selected preset */}
          {selected && <RangePreview preset={selected} />}
        </div>
      )}
    </div>
  )
}

export function GradingScaleStep({
  selectedPrograms,
  seedGradingScale,
  gradingScaleByProgram,
  onToggleSeed,
  onSelectPreset,
}: GradingScaleStepProps) {
  const programs = Array.from(selectedPrograms)

  return (
    <div className="space-y-3">
      {/* Section header with enable/disable toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Grading Scales
        </Label>
        <button
          type="button"
          onClick={() => onToggleSeed(!seedGradingScale)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            seedGradingScale ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              seedGradingScale ? "translate-x-4" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {!seedGradingScale ? (
        <p className="text-xs text-muted-foreground">
          Grading scale seeding is disabled. Configure manually later in the Grading Scales section.
        </p>
      ) : programs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Select programs above to configure their grading scales.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Assign one grading scale per program. Each scale will be saved and applied to that program&aposs levels.
          </p>
          {programs.map((prog) => (
            <ProgramScalePanel
              key={prog}
              prog={prog}
              selectedPresetKey={gradingScaleByProgram[prog] ?? GRADING_SCALE_PRESETS[0].key}
              onSelect={(presetKey) => onSelectPreset(prog, presetKey)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
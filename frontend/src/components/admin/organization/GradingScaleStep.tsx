// frontend/src/components/admin/organization/GradingScaleStep.tsx
"use client"

import { BarChart3, Check, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { GRADING_SCALE_PRESETS, type GradingScalePreset } from "./constants/seed-data"

interface GradingScaleStepProps {
  seedGradingScale:    boolean
  selectedKey:         string | null
  onToggleSeed:        (v: boolean) => void
  onSelectPreset:      (key: string) => void
}

function RangePreview({ preset }: { preset: GradingScalePreset }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
      >
        <span>Preview grading ranges</span>
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

export function GradingScaleStep({
  seedGradingScale,
  selectedKey,
  onToggleSeed,
  onSelectPreset,
}: GradingScaleStepProps) {
  const selected = GRADING_SCALE_PRESETS.find((p) => p.key === selectedKey) ?? null

  return (
    <div className="space-y-3">
      {/* Section header with toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Grading Scale
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
          Grading scale seeding is disabled. You can configure it manually later in the Grading Scales section.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Choose a grading scale preset to apply to all levels. You can edit or add more later.
          </p>

          {/* Preset cards */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GRADING_SCALE_PRESETS.map((preset) => {
              const isSelected = selectedKey === preset.key
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onSelectPreset(preset.key)}
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

          {/* Range preview for selected preset */}
          {selected && <RangePreview preset={selected} />}
        </div>
      )}
    </div>
  )
}
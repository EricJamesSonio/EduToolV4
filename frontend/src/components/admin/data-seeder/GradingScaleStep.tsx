// frontend/src/components/admin/data-seeder/GradingScaleStep.tsx
"use client"

import { Check } from "lucide-react"
import { Badge }  from "@/components/ui/badge"
import { cn }     from "@/lib/utils"
import { GRADING_SCALE_PRESETS } from "./constants/seed-data"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"

interface GradingScaleStepProps {
  selectedPrograms:        Set<string>
  seedGradingScale:        boolean
  gradingScaleByProgram:   Record<string, string>       // prog → presetKey
  onToggleSeed:            (v: boolean) => void
  onSelectPreset:          (prog: string, presetKey: string) => void
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
      <EnableToggle enabled={seedGradingScale} onToggle={onToggleSeed} />

      {!seedGradingScale ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Grading scale seeding is disabled. Configure manually later in the Grading Scales section.
        </p>
      ) : programs.length === 0 ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Select programs above to configure their grading scales.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Assign one grading scale per program. Each scale will be saved and applied to that program &apos;s levels.
          </p>
          {programs.map((prog) => {
            const selectedPresetKey = gradingScaleByProgram[prog] ?? GRADING_SCALE_PRESETS[0].key
            const selected = GRADING_SCALE_PRESETS.find((p) => p.key === selectedPresetKey)

            return (
              <ProgramPanel
                key={prog}
                program={prog}
                badge={
                  selected && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {selected.name}
                    </Badge>
                  )
                }
              >
                {/* Preset grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GRADING_SCALE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetKey === preset.key
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => onSelectPreset(prog, preset.key)}
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
                {selected && (
                  <CollapsiblePreview label="Preview ranges" count={selected.ranges.length}>
                    {selected.ranges.map((range, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                            {range.gradeValue}
                          </Badge>
                          <span className="text-muted-foreground not-interactive">{range.label}</span>
                        </div>
                        <span className="font-mono text-muted-foreground tabular-nums not-interactive">
                          {range.minScore}–{range.maxScore}%
                        </span>
                      </div>
                    ))}
                  </CollapsiblePreview>
                )}
              </ProgramPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

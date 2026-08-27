// frontend/src/components/admin/data-seeder/GradingScaleStep.tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { GRADING_SCALE_PRESETS } from "./constants/seed-data"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"
import { SelectableCard } from "./ui/SelectableCard"

import type { GradingScalePreset } from "./constants/grading-scales"

interface GradingScaleStepProps {
  selectedPrograms:        Set<string>
  seedGradingScale:        boolean
  gradingScaleByProgram:   Record<string, string>
  disabledScaleNames:      Set<string>
  onToggleSeed:            (v: boolean) => void
  onSelectPreset:          (prog: string, presetKey: string) => void
  scalesByProgramOverride?: Record<string, GradingScalePreset> | null
}

export function GradingScaleStep({
  selectedPrograms,
  seedGradingScale,
  gradingScaleByProgram,
  disabledScaleNames,
  onToggleSeed,
  onSelectPreset,
  scalesByProgramOverride,
}: GradingScaleStepProps) {
  const programs = Array.from(selectedPrograms)
  const hasOverride = !!scalesByProgramOverride

  return (
    <div className="space-y-3">
      <EnableToggle enabled={seedGradingScale} onToggle={onToggleSeed} />

      {!seedGradingScale ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Grading scale seeding is disabled. Configure manually later in the Grading Scales section.
        </p>
      ) : programs.length === 0 ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Select departments above to configure their grading scales.
        </p>
      ) : hasOverride ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Using grading scales configured in School Profile (one per department). Enable seeding to create them.
          </p>
          {programs.map((prog) => {
            const preset = scalesByProgramOverride![prog]
            if (!preset) {
              return (
                <ProgramPanel key={prog} program={prog} badge={<Badge variant="secondary" className="text-xs font-normal">Not configured</Badge>}>
                  <p className="text-xs text-muted-foreground">No grading scale configured for this department. Add one in Configure → Grading Scales.</p>
                </ProgramPanel>
              )
            }
            const alreadyExists = disabledScaleNames.has(preset.name)
            return (
              <ProgramPanel
                key={prog}
                program={prog}
                badge={<Badge variant={alreadyExists ? "secondary" : "outline"} className="text-xs font-normal">{alreadyExists ? "Already exists" : preset.name}</Badge>}
              >
                <SelectableCard
                  selected={!alreadyExists}
                  onSelect={() => {}}
                  title={preset.name}
                  subtitle={`${preset.ranges.length} grade ${preset.ranges.length === 1 ? "range" : "ranges"} (configured)`}
                  disabled={alreadyExists}
                  disabledReason={alreadyExists ? "Already exists — edit it on the Grading Scales page" : undefined}
                />
                {!alreadyExists && (
                  <CollapsiblePreview label="Preview ranges" count={preset.ranges.length}>
                    {preset.ranges.map((range, i) => (
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
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Assign one grading scale per department. Each scale will be saved and applied to that department&apos;s levels.
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {GRADING_SCALE_PRESETS.map((preset) => {
                    const alreadyExists = disabledScaleNames.has(preset.name)
                    return (
                      <SelectableCard
                        key={preset.key}
                        selected={selectedPresetKey === preset.key}
                        onSelect={() => onSelectPreset(prog, preset.key)}
                        title={preset.name}
                        subtitle={`${preset.ranges.length} grade ${
                          preset.ranges.length === 1 ? "range" : "ranges"
                        }`}
                        disabled={alreadyExists}
                        disabledReason={
                          alreadyExists
                            ? "Already exists — edit it on the Grading Scales page"
                            : undefined
                        }
                      />
                    )
                  })}
                </div>

                {selected && !disabledScaleNames.has(selected.name) && (
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
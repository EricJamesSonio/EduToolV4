"use client"

import { Badge } from "@/components/ui/badge"
import { GRADING_SCHEME_TEMPLATES } from "./constants/seed-data"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"
import { SelectableCard } from "./ui/SelectableCard"

interface GradingSchemeStepProps {
  selectedPrograms:        Set<string>
  seedGradingSchemes:      boolean
  gradingSchemesByProgram: Record<string, boolean>
  onToggleSeed:            (enabled: boolean) => void
  onToggleScheme:          (programType: string, enabled: boolean) => void
}

export function GradingSchemeStep({
  selectedPrograms,
  seedGradingSchemes,
  gradingSchemesByProgram,
  onToggleSeed,
  onToggleScheme,
}: GradingSchemeStepProps) {
  const applicableSchemes = GRADING_SCHEME_TEMPLATES.filter((scheme) =>
    selectedPrograms.has(scheme.programType)
  )

  if (applicableSchemes.length === 0) return null

  return (
    <div className="space-y-3">
      <EnableToggle enabled={seedGradingSchemes} onToggle={onToggleSeed} />

      {!seedGradingSchemes ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Grading scheme templates will not be created. Enable above to include them.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Select which grading scheme templates to create for your departments:
          </p>
          {applicableSchemes.map((scheme) => {
            const isSelected = gradingSchemesByProgram[scheme.programType] !== false

            return (
              <ProgramPanel
                key={scheme.programType}
                program={scheme.programType}
                badge={
                  <Badge variant={isSelected ? "outline" : "secondary"} className="text-xs font-normal">
                    {isSelected ? scheme.name : "Not selected"}
                  </Badge>
                }
              >
                {/* Scheme selectable card */}
                <SelectableCard
                  selected={isSelected}
                  onSelect={() => onToggleScheme(scheme.programType, !isSelected)}
                  title={scheme.name}
                  subtitle={`${scheme.components.length} ${
                    scheme.components.length === 1 ? "component" : "components"
                  }`}
                />

                {/* Components preview */}
                <CollapsiblePreview label="Preview components" count={scheme.components.length}>
                  {scheme.components.map((comp) => (
                    <div key={comp.name} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">
                          {comp.type}
                        </Badge>
                        <span className="text-muted-foreground not-interactive">{comp.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground tabular-nums not-interactive">
                        {comp.weight}%
                      </span>
                    </div>
                  ))}
                </CollapsiblePreview>
              </ProgramPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}

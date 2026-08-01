"use client"

import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn }    from "@/lib/utils"
import { GRADING_SCHEME_TEMPLATES } from "./constants/seed-data"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"

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
            Select which grading scheme templates to create for your programs:
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
                {/* Scheme toggle card */}
                <button
                  type="button"
                  onClick={() => onToggleScheme(scheme.programType, !isSelected)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{scheme.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {scheme.components.length} {scheme.components.length === 1 ? "component" : "components"}
                    </p>
                  </div>
                </button>

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

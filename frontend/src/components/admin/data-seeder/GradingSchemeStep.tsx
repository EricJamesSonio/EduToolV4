"use client"

import { cn } from "@/lib/utils"
import { GRADING_SCHEME_TEMPLATES, PROGRAMS } from "./constants/seed-data"

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
  const programNameMap = Object.fromEntries(PROGRAMS.map((p) => [p.key, p.label]))

  if (applicableSchemes.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Enable/disable toggle */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onToggleSeed(!seedGradingSchemes)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            seedGradingSchemes ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              seedGradingSchemes ? "translate-x-4" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {!seedGradingSchemes ? (
        <p className="text-xs text-muted-foreground">
          Grading scheme templates will not be created. Enable above to include them.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Select which grading scheme templates to create for your programs:
          </p>
          {applicableSchemes.map((scheme) => {
            const isSelected = gradingSchemesByProgram[scheme.programType] !== false
            const programLabel = programNameMap[scheme.programType] || scheme.programType

            return (
              <div
                key={scheme.programType}
                className={cn(
                  "border rounded-md p-3 transition-colors",
                  isSelected
                    ? "bg-white dark:bg-slate-950 border-amber-200 dark:border-amber-900"
                    : "bg-muted/50 border-muted-foreground/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`scheme-${scheme.programType}`}
                    checked={isSelected}
                    onChange={(e) => onToggleScheme(scheme.programType, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`scheme-${scheme.programType}`}
                      className="block text-sm font-medium cursor-pointer mb-2"
                    >
                      {scheme.name}
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                      For: <span className="font-medium">{programLabel}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {scheme.components.map((comp) => (
                        <div
                          key={comp.name}
                          className="bg-muted/50 rounded px-2 py-1.5 text-xs border border-muted-foreground/10"
                        >
                          <div className="font-medium text-foreground truncate">{comp.name}</div>
                          <div className="text-muted-foreground text-xs mt-0.5">
                            {comp.weight}% • {comp.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

"use client"

import { ChevronDown, ChevronRight, Scale } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Collapsible } from "./ui/Collapsible"
import { Checkbox } from "./ui/Checkbox"
import { GRADING_SCHEME_TEMPLATES, PROGRAMS, type GradingSchemeTemplate } from "./constants/seed-data"

interface GradingSchemeStepProps {
  selectedPrograms: Set<string>
  seedGradingSchemes: boolean
  gradingSchemesByProgram: Record<string, boolean>
  onToggleSeed: (enabled: boolean) => void
  onToggleScheme: (programType: string, enabled: boolean) => void
}

export function GradingSchemeStep({
  selectedPrograms,
  seedGradingSchemes,
  gradingSchemesByProgram,
  onToggleSeed,
  onToggleScheme,
}: GradingSchemeStepProps) {
  const [expanded, setExpanded] = useState(true)

  const applicableSchemes = GRADING_SCHEME_TEMPLATES.filter((scheme) =>
    selectedPrograms.has(scheme.programType)
  )

  const programNameMap = Object.fromEntries(PROGRAMS.map((p) => [p.key, p.label]))

  if (applicableSchemes.length === 0) return null

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full py-3 px-4 hover:bg-muted/50 rounded-md transition-colors text-sm font-medium"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Scale className="h-4 w-4 text-amber-600" />
        <span>Grading Scheme Templates</span>
        {seedGradingSchemes && (
          <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded">
            {applicableSchemes.filter((s) => gradingSchemesByProgram[s.programType] !== false).length} selected
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-4 px-4 py-3 bg-muted/30 rounded-md">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="seed-schemes"
              checked={seedGradingSchemes}
              onChange={(e) => onToggleSeed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
            <label htmlFor="seed-schemes" className="text-sm font-medium cursor-pointer">
              Seed grading scheme templates
            </label>
          </div>

          {seedGradingSchemes && applicableSchemes.length > 0 && (
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

          {!seedGradingSchemes && (
            <p className="text-xs text-muted-foreground italic">
              Grading scheme templates will not be created. Enable above to include them.
            </p>
          )}
        </div>
      )}
    </Collapsible>
  )
}
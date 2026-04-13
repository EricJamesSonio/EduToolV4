"use client"

import { ChevronDown, ChevronRight, Calendar } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Collapsible } from "./ui/Collapsible"
import { Checkbox } from "./ui/Checkbox"
import { SEMESTER_TEMPLATES, PROGRAMS, type SemesterTemplate } from "./constants/seed-data"

interface SemesterTemplateStepProps {
  selectedPrograms: Set<string>
  seedSemesterTemplates: boolean
  semesterTemplatesByProgram: Record<string, boolean>
  onToggleSeed: (enabled: boolean) => void
  onToggleTemplate: (programType: string, enabled: boolean) => void
}

export function SemesterTemplateStep({
  selectedPrograms,
  seedSemesterTemplates,
  semesterTemplatesByProgram,
  onToggleSeed,
  onToggleTemplate,
}: SemesterTemplateStepProps) {
  const [expanded, setExpanded] = useState(true)
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const applicableTemplates = SEMESTER_TEMPLATES.filter((tpl) =>
    selectedPrograms.has(tpl.programType)
  )

  const programNameMap = Object.fromEntries(PROGRAMS.map((p) => [p.key, p.label]))

  const toggleTemplateExpanded = (programType: string) => {
    const next = new Set(expandedTemplates)
    if (next.has(programType)) {
      next.delete(programType)
    } else {
      next.add(programType)
    }
    setExpandedTemplates(next)
  }

  if (applicableTemplates.length === 0) return null

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
        <Calendar className="h-4 w-4 text-blue-600" />
        <span>Semester Templates</span>
        {seedSemesterTemplates && (
          <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
            {applicableTemplates.filter((t) => semesterTemplatesByProgram[t.programType] !== false).length} selected
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-4 px-4 py-3 bg-muted/30 rounded-md">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="seed-semesters"
              checked={seedSemesterTemplates}
              onChange={(e) => onToggleSeed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
            <label htmlFor="seed-semesters" className="text-sm font-medium cursor-pointer">
              Seed semester templates
            </label>
          </div>

          {seedSemesterTemplates && applicableTemplates.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Select which semester templates to create. Each includes quarters/terms for enrollment periods:
              </p>

              {applicableTemplates.map((template) => {
                const isSelected = semesterTemplatesByProgram[template.programType] !== false
                const isExpanded = expandedTemplates.has(template.programType)
                const programLabel = programNameMap[template.programType] || template.programType
                const totalTerms = template.semesters.reduce((sum, sem) => sum + sem.terms.length, 0)

                return (
                  <div
                    key={template.programType}
                    className={cn(
                      "border rounded-md overflow-hidden transition-colors",
                      isSelected
                        ? "bg-white dark:bg-slate-950 border-blue-200 dark:border-blue-900"
                        : "bg-muted/50 border-muted-foreground/20"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        toggleTemplateExpanded(template.programType)
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          onToggleTemplate(template.programType, e.target.checked)
                        }}
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {programLabel} • {template.semesters.length} semester(s) • {totalTerms} term(s)
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-muted-foreground/10 bg-muted/20 space-y-2">
                        {template.semesters.map((semester, semIdx) => (
                          <div key={`${template.programType}-sem-${semIdx}`} className="text-xs">
                            <div className="font-semibold text-foreground mb-1">{semester.name}</div>
                            <div className="flex gap-2 flex-wrap">
                              {semester.terms.map((term) => (
                                <span
                                  key={`${template.programType}-term-${term.order_index}`}
                                  className="inline-block bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800"
                                >
                                  {term.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!seedSemesterTemplates && (
            <p className="text-xs text-muted-foreground italic">
              Semester templates will not be created. Enable above to include them.
            </p>
          )}
        </div>
      )}
    </Collapsible>
  )
}
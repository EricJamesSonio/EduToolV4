"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SEMESTER_TEMPLATES, PROGRAMS } from "./constants/seed-data"

interface SemesterTemplateStepProps {
  selectedPrograms:           Set<string>
  seedSemesterTemplates:      boolean
  semesterTemplatesByProgram: Record<string, boolean>
  onToggleSeed:               (enabled: boolean) => void
  onToggleTemplate:           (programType: string, enabled: boolean) => void
}

export function SemesterTemplateStep({
  selectedPrograms,
  seedSemesterTemplates,
  semesterTemplatesByProgram,
  onToggleSeed,
  onToggleTemplate,
}: SemesterTemplateStepProps) {
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const applicableTemplates = SEMESTER_TEMPLATES.filter((tpl) =>
    selectedPrograms.has(tpl.programType)
  )
  const programNameMap = Object.fromEntries(PROGRAMS.map((p) => [p.key, p.label]))

  const toggleExpanded = (programType: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev)
      next.has(programType) ? next.delete(programType) : next.add(programType)
      return next
    })
  }

  if (applicableTemplates.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Enable/disable toggle */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => onToggleSeed(!seedSemesterTemplates)}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            seedSemesterTemplates ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              seedSemesterTemplates ? "translate-x-4" : "translate-x-1"
            )}
          />
        </button>
      </div>

      {!seedSemesterTemplates ? (
        <p className="text-xs text-muted-foreground">
          Semester templates will not be created. Enable above to include them.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Select which semester templates to create. Each includes quarters/terms for enrollment periods:
          </p>
          {applicableTemplates.map((template) => {
            const isSelected      = semesterTemplatesByProgram[template.programType] !== false
            const isExpanded      = expandedTemplates.has(template.programType)
            const programLabel    = programNameMap[template.programType] || template.programType
            const totalTerms      = template.semesters.reduce((sum, sem) => sum + sem.terms.length, 0)

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
                  onClick={() => toggleExpanded(template.programType)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation()
                      onToggleTemplate(template.programType, e.target.checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {programLabel} • {template.semesters.length} semester(s) • {totalTerms} term(s)
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronDown  className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  }
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
    </div>
  )
}

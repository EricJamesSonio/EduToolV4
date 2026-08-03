"use client"

import { Badge } from "@/components/ui/badge"
import { SEMESTER_TEMPLATES } from "./constants/seed-data"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"
import { SelectableCard } from "./ui/SelectableCard"

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
  const applicableTemplates = SEMESTER_TEMPLATES.filter((tpl) =>
    selectedPrograms.has(tpl.programType)
  )

  if (applicableTemplates.length === 0) return null

  return (
    <div className="space-y-3">
      <EnableToggle enabled={seedSemesterTemplates} onToggle={onToggleSeed} />

      {!seedSemesterTemplates ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Semester templates will not be created. Enable above to include them.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Select which semester templates to create. Each includes quarters/terms for enrollment periods:
          </p>
          {applicableTemplates.map((template) => {
            const isSelected = semesterTemplatesByProgram[template.programType] !== false
            const totalTerms = template.semesters.reduce(
              (sum, sem) => sum + sem.terms.length,
              0
            )

            return (
              <ProgramPanel
                key={template.programType}
                program={template.programType}
                badge={
                  <Badge variant={isSelected ? "outline" : "secondary"} className="text-xs font-normal">
                    {isSelected ? template.name : "Not selected"}
                  </Badge>
                }
              >
                {/* Template selectable card */}
                <SelectableCard
                  selected={isSelected}
                  onSelect={() => onToggleTemplate(template.programType, !isSelected)}
                  title={template.name}
                  subtitle={`${template.semesters.length} ${
                    template.semesters.length === 1 ? "semester" : "semesters"
                  } • ${totalTerms} ${totalTerms === 1 ? "term" : "terms"}`}
                />

                {/* Terms preview */}
                <CollapsiblePreview label="Preview terms" count={totalTerms}>
                  {template.semesters.map((semester, semIdx) => (
                    <div
                      key={`${template.programType}-sem-${semIdx}`}
                      className="px-3 py-1.5 space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-foreground not-interactive">
                        {semester.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {semester.terms.map((term) => (
                          <Badge
                            key={`${template.programType}-term-${term.order_index}`}
                            variant="secondary"
                            className="font-normal text-[11px] px-2 py-0"
                          >
                            {term.name}
                          </Badge>
                        ))}
                      </div>
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

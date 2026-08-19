"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildGenericTemplate, SEMESTER_TEMPLATE_BY_PROGRAM } from "./constants/semester-templates"
import { CollapsiblePreview } from "./ui/CollapsiblePreview"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"
import { SelectableCard } from "./ui/SelectableCard"
import {
  getBreakCount,
  isCalendarConfigured,
  MIN_CALENDAR_PERIODS,
  type ProgramCalendarDraft,
} from "./hooks/useSeedState"

interface SemesterTemplateStepProps {
  selectedPrograms:           Set<string>
  seedSemesterTemplates:      boolean
  semesterTemplatesByProgram: Record<string, boolean>
  seedProgramCalendars:       boolean
  programCalendarConfigs:     Record<string, ProgramCalendarDraft>
  onToggleSeed:               (enabled: boolean) => void
  onToggleTemplate:           (programType: string, enabled: boolean) => void
}

export function SemesterTemplateStep({
  selectedPrograms,
  seedSemesterTemplates,
  semesterTemplatesByProgram,
  seedProgramCalendars,
  programCalendarConfigs,
  onToggleSeed,
  onToggleTemplate,
}: SemesterTemplateStepProps) {
  const applicablePrograms = Array.from(selectedPrograms).filter(
    (p) => !!SEMESTER_TEMPLATE_BY_PROGRAM[p]
  )

  if (applicablePrograms.length === 0) return null

  // At least one selected department needs a fully-configured calendar
  // (Academic Calendar step on + >= MIN_CALENDAR_PERIODS complete periods)
  // before this step is usable at all — there's nothing to derive a template
  // from otherwise.
  const hasAnyConfiguredCalendar =
    seedProgramCalendars &&
    applicablePrograms.some((p) => isCalendarConfigured(programCalendarConfigs[p]))

  return (
    <div className="space-y-3">
      <EnableToggle
        enabled={seedSemesterTemplates && hasAnyConfiguredCalendar}
        onToggle={onToggleSeed}
        disabled={!hasAnyConfiguredCalendar}
      />

      {!hasAnyConfiguredCalendar ? (
        <p className="text-xs text-muted-foreground not-interactive">
          {!seedProgramCalendars
            ? "Enable and configure the Academic Calendar step above first. Semester templates are generated from each department's calendar — they aren't entered separately."
            : `None of your departments have a fully configured calendar yet. Give a department at least ${MIN_CALENDAR_PERIODS} complete periods in the Academic Calendar step above to unlock its semester template here.`}
        </p>
      ) : !seedSemesterTemplates ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Semester templates will not be created. Enable above to include them.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Each template&apos;s semester count is generated from its department&apos;s academic
            calendar above — {MIN_CALENDAR_PERIODS} calendar periods produce{" "}
            {MIN_CALENDAR_PERIODS} semesters, 3 periods produce a trimester template, and so on.
          </p>
          {applicablePrograms.map((programType) => {
            const base = SEMESTER_TEMPLATE_BY_PROGRAM[programType]
            const config = programCalendarConfigs[programType]
            const breakCount = getBreakCount(config)
            const configured = isCalendarConfigured(config)
            const isSelected = configured && semesterTemplatesByProgram[programType] !== false
            const liveTemplate = configured
              ? buildGenericTemplate(base.name, programType, breakCount)
              : null
            const totalTerms =
              liveTemplate?.semesters.reduce((sum, sem) => sum + sem.terms.length, 0) ?? 0

            return (
              <div
                key={programType}
                className={cn(
                  "transition-opacity",
                  !configured && "opacity-40 pointer-events-none select-none"
                )}
              >
                <ProgramPanel
                  program={programType}
                  badge={
                    <Badge
                      variant={isSelected ? "outline" : "secondary"}
                      className="text-xs font-normal"
                    >
                      {!configured
                        ? "Calendar not configured"
                        : isSelected
                          ? liveTemplate!.name
                          : "Not selected"}
                    </Badge>
                  }
                >
                  {!configured ? (
                    <p className="text-xs text-muted-foreground not-interactive">
                      Add at least {MIN_CALENDAR_PERIODS} complete periods to this
                      department&apos;s calendar above ({breakCount} of {MIN_CALENDAR_PERIODS}{" "}
                      set) to enable its semester template.
                    </p>
                  ) : (
                    <>
                      {/* Template selectable card */}
                      <SelectableCard
                        selected={isSelected}
                        onSelect={() => onToggleTemplate(programType, !isSelected)}
                        title={liveTemplate!.name}
                        subtitle={`${liveTemplate!.semesters.length} ${
                          liveTemplate!.semesters.length === 1 ? "semester" : "semesters"
                        } • ${totalTerms} ${totalTerms === 1 ? "term" : "terms"}`}
                      />

                      {/* Terms preview */}
                      <CollapsiblePreview label="Preview terms" count={totalTerms}>
                        {liveTemplate!.semesters.map((semester, semIdx) => (
                          <div
                            key={`${programType}-sem-${semIdx}`}
                            className="px-3 py-1.5 space-y-1.5"
                          >
                            <div className="text-xs font-semibold text-foreground not-interactive">
                              {semester.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {semester.terms.map((term) => (
                                <Badge
                                  key={`${programType}-term-${term.order_index}`}
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
                    </>
                  )}
                </ProgramPanel>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
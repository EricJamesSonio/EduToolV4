"use client"

import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BreakEditor } from "@/components/admin/academic-calendar/BreakEditor"
import { SEMESTER_TEMPLATES } from "./constants/seed-data"
import { EnableToggle } from "./ui/EnableToggle"
import { ProgramPanel } from "./ui/ProgramPanel"
import type { ProgramCalendarDraft } from "./hooks/useSeedState"

interface ProgramCalendarStepProps {
  selectedPrograms:           Set<string>
  seedProgramCalendars:       boolean
  programCalendarConfigs:     Record<string, ProgramCalendarDraft>
  onToggleSeed:               (enabled: boolean) => void
  onInitProgramCalendar:      (prog: string, defaults: Partial<ProgramCalendarDraft>) => void
  onUpdateProgramCalendar:    (prog: string, patch: Partial<ProgramCalendarDraft>) => void
  semesterTemplatesByProgram: Record<string, boolean>
  schoolYearStart?:           string
  schoolYearEnd?:             string
}

export function ProgramCalendarStep({
  selectedPrograms,
  seedProgramCalendars,
  programCalendarConfigs,
  onToggleSeed,
  onInitProgramCalendar,
  onUpdateProgramCalendar,
  semesterTemplatesByProgram,
  schoolYearStart,
  schoolYearEnd,
}: ProgramCalendarStepProps) {
  const programs = Array.from(selectedPrograms)

  // Prefill each department's draft with the school-year dates when the step
  // is first enabled, AND whenever a new department is selected afterward so
  // it always gets the default 2-break skeleton (only seeds drafts that don't
  // exist yet, so existing user entries are preserved).
  useEffect(() => {
    if (!seedProgramCalendars) return
    programs.forEach((prog) => {
      onInitProgramCalendar(prog, {
        startDate: schoolYearStart?.slice(0, 10) ?? "",
        endDate:   schoolYearEnd?.slice(0, 10) ?? "",
      })
    })

  }, [seedProgramCalendars, selectedPrograms, schoolYearStart, schoolYearEnd])

  return (
    <div className="space-y-3">
      <EnableToggle enabled={seedProgramCalendars} onToggle={onToggleSeed} />

      {!seedProgramCalendars ? (
        <p className="text-xs text-muted-foreground not-interactive">
          Department academic calendars will not be created. Enable above to define each
          department&apos;s calendar — a calendar is required before semester templates can be
          auto-registered.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground not-interactive">
            Set up each department&apos;s calendar. Define the number of semester periods and
            their date ranges — the semester template will be auto-generated with one semester
            per period, so the two are always in sync.
          </p>

          {programs.map((prog) => {
            const config = programCalendarConfigs[prog]
            const template = SEMESTER_TEMPLATES.find((t) => t.programType === prog)
            const templateEnabled = semesterTemplatesByProgram[prog] !== false
            const breakCount =
              config?.breaks.filter((b) => b.startDate && b.endDate).length ?? 0

            return (
              <ProgramPanel
                key={prog}
                program={prog}
                badge={
                  <Badge variant={breakCount > 0 ? "outline" : "secondary"} className="text-xs font-normal">
                    {breakCount > 0 ? `${breakCount} period(s)` : "No periods"}
                  </Badge>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={config?.startDate ?? ""}
                      min={schoolYearStart?.slice(0, 10)}
                      max={schoolYearEnd?.slice(0, 10)}
                      onChange={(e) => onUpdateProgramCalendar(prog, { startDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">End Date</label>
                    <Input
                      type="date"
                      value={config?.endDate ?? ""}
                      min={schoolYearStart?.slice(0, 10)}
                      max={schoolYearEnd?.slice(0, 10)}
                      onChange={(e) => onUpdateProgramCalendar(prog, { endDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Notes (optional)</label>
                  <Input
                    value={config?.notes ?? ""}
                    onChange={(e) => onUpdateProgramCalendar(prog, { notes: e.target.value })}
                    placeholder="Any notes for this calendar"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">
                    Semester Periods
                  </p>
                  <p className="text-xs text-muted-foreground not-interactive">
                    Each period is a semester teaching block for this department. The semester
                    template for this department is auto-generated to match the number of periods
                    (one semester per period).
                  </p>
                  <BreakEditor
                    breaks={config?.breaks ?? []}
                    onChange={(breaks) => onUpdateProgramCalendar(prog, { breaks })}
                    calendarStart={config?.startDate ?? ""}
                    calendarEnd={config?.endDate ?? ""}
                  />
                </div>

                {template && templateEnabled && breakCount > 0 && (
                  <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                    <p className="text-xs text-emerald-600 not-interactive">
                      {breakCount} period(s) — the {template.name} will be auto-generated with{" "}
                      {breakCount} semester(s) and auto-registered for this department.
                    </p>
                  </div>
                )}
              </ProgramPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}
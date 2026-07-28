"use client"

import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import type { AssignRowProps } from "./assign-row/types"
import { toDateInput } from "./assign-row/helpers"
import { useAssignRow } from "./assign-row/use-assign-row"
import { TermDatesPanel } from "./assign-row/term-dates-panel"
import { ConfirmDialog } from "./assign-row/confirm-dialog"

export function AssignRow({
  program,
  templates,
  schoolYearStart,
  schoolYearEnd,
}: AssignRowProps): React.JSX.Element {
  const {
    current,
    selectedTemplateId,
    assignedTemplate,
    allTerms,
    termDates,
    expanded,
    setExpanded,
    panelMode,
    setPanelMode,
    savingDates,
    isPending,
    validation,
    confirmOpen,
    handleConfirm,
    handleCancelConfirm,
    requestTemplateChange,
    handleDateChange,
    handleRequestSave,
    handleSaveDates,
    handleCancelEdit,
    confirmSaveOpen,
    setConfirmSaveOpen,
    hasNoCalendar,
    calendarBreaks,
    calendarStart,
    calendarEnd,
    matchingTemplates,
    handleSmartDateConfig,
  } = useAssignRow(program, templates)

  const syMin = schoolYearStart ? toDateInput(schoolYearStart) : ""
  const syMax = schoolYearEnd ? toDateInput(schoolYearEnd) : ""

  const hasAssignment = !!current
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  return (
    <div className="py-2.5 px-1 space-y-2">
      {/* Row */}
      <div className="flex items-center gap-3">
        {current ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}

        <span className="text-sm font-medium flex-1 truncate not-interactive">{program.name}</span>

        {hasNoCalendar ? (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 shrink-0 ml-auto not-interactive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            No Calendar
          </Badge>
        ) : (
          <div className="w-52">
            <Select
              value={selectedTemplateId ?? "none"}
              onValueChange={(value) => value && requestTemplateChange(value)}
              disabled={isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Assign template…">
                  {selectedTemplate ? selectedTemplate.name : current?.template.name ?? "Assign template…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {matchingTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.semesters.length} sem)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasAssignment && allTerms.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setExpanded((v) => !v)}
          >
            <CalendarDays className="h-4 w-4" />
            {expanded ? (
              <ChevronUp className="h-3 w-3 ml-0.5" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-0.5" />
            )}
          </Button>
        )}
      </div>

      {/* No calendar banner */}
      {hasNoCalendar && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="not-interactive">
            Set up an Academic Calendar for this program first (go to{" "}
            <strong>Academic Calendar → Program Calendars</strong>), then
            assign a semester template.
          </span>
        </div>
      )}

      {/* Calendar break info */}
      {!hasNoCalendar && calendarBreaks.length > 0 && (
        <p className="text-[11px] text-muted-foreground px-1 not-interactive">
          Calendar has <strong>{calendarBreaks.length} break point{calendarBreaks.length !== 1 ? "s" : ""}</strong>{" "}
          ({calendarBreaks.map((b) => b.label).join(", ")}) — only templates with {calendarBreaks.length} semester(s) shown.
        </p>
      )}

      {/* Term dates panel */}
      {expanded && (
        <>
          {(!selectedTemplateId || selectedTemplateId === "none" || allTerms.length === 0) ? (
            <div className="border bg-muted/30 p-4 rounded-md w-full text-center text-xs text-muted-foreground not-interactive">
              {hasNoCalendar
                ? "Set up an academic calendar first, then select a matching template."
                : "Select a template to configure term dates."}
            </div>
          ) : (
            <TermDatesPanel
              templateName={selectedTemplate?.name ?? ""}
              allTerms={allTerms}
              termDates={termDates}
              isValid={validation.isValid}
              savingDates={savingDates}
              panelMode={panelMode}
              syMin={syMin}
              syMax={syMax}
              onDateChange={handleDateChange}
              onRequestSave={handleRequestSave}
              onCancelEdit={handleCancelEdit}
              onEnterEdit={() => setPanelMode("edit")}
              onClose={() => setExpanded(false)}
              onSmartDateConfig={handleSmartDateConfig}
            />
          )}
        </>
      )}

      {/* Template change confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Change template?"
        description="This will replace the current template assignment. Existing term dates will be removed."
        confirmLabel="Yes, change it"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

      {/* Save dates confirm */}
      <ConfirmDialog
        open={confirmSaveOpen}
        title="Save term dates?"
        description="This will assign the template with the configured term dates."
        confirmLabel="Apply"
        onConfirm={handleSaveDates}
        onCancel={() => setConfirmSaveOpen(false)}
      />
    </div>
  )
}

// frontend/src/components/admin/semester-settings/AssignRow.tsx
"use client"

import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  } = useAssignRow(program, templates)

  const syMin = schoolYearStart ? toDateInput(schoolYearStart) : ""
  const syMax = schoolYearEnd ? toDateInput(schoolYearEnd) : ""

  return (
    <div className="py-2.5 px-1 space-y-2">
      {/* Row */}
      <div className="flex items-center gap-3">
        {current ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}

        <span className="text-sm font-medium flex-1 truncate">{program.name}</span>

        <div className="w-52">
          <Select
            value={current?.template_id ?? "none"}
            onValueChange={requestTemplateChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Assign template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {current && allTerms.length > 0 && (
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

      {/* Panel */}
      {expanded && current && allTerms.length > 0 && (
        <TermDatesPanel
          templateName={assignedTemplate?.name ?? current.template.name}
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
        />
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
        description="This will overwrite any previously saved term dates for this program."
        confirmLabel="Save"
        onConfirm={handleSaveDates}
        onCancel={() => setConfirmSaveOpen(false)}
      />
    </div>
  )
}
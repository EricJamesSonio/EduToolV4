// components/assign-row/assign-row.tsx
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

import type { SemesterTemplate } from "@/types/admin/semester-template.types"
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
    allTerms,
    termDates,
    expanded,
    setExpanded,
    savingDates,
    isPending,
    validation,
    confirmOpen,
    handleConfirm,
    handleCancelConfirm,
    requestTemplateChange,
    handleDateChange,
    handleSaveDates,
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

      {/* Term dates panel */}
      {expanded && current && allTerms.length > 0 && (
        <TermDatesPanel
          allTerms={allTerms}
          termDates={termDates}
          isValid={validation.isValid}
          savingDates={savingDates}
          syMin={syMin}
          syMax={syMax}
          onDateChange={handleDateChange}
          onSave={handleSaveDates}
          onCancel={() => setExpanded(false)}
        />
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  )
}
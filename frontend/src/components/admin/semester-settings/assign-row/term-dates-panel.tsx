// frontend/src/components/admin/semester-settings/assign-row/term-dates-panel.tsx
"use client"

import { AlertCircle, Pencil, CalendarRange } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TermDateRow } from "./term-date-row"
import type { TermDatesMap, TermWithSemester } from "./types"
import type { PanelMode } from "./use-assign-row"

interface TermDatesPanelProps {
  templateName: string
  allTerms: TermWithSemester[]
  termDates: TermDatesMap
  isValid: boolean
  savingDates: boolean
  panelMode: PanelMode
  syMin: string
  syMax: string
  onDateChange: (termId: string, field: "startDate" | "endDate", value: string) => void
  onRequestSave: () => void
  onCancelEdit: () => void
  onEnterEdit: () => void
  onClose: () => void
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function TermDatesPanel({
  templateName,
  allTerms,
  termDates,
  isValid,
  savingDates,
  panelMode,
  syMin,
  syMax,
  onDateChange,
  onRequestSave,
  onCancelEdit,
  onEnterEdit,
  onClose,
}: TermDatesPanelProps) {
  // Group terms by semesterName for cleaner view
  const grouped = allTerms.reduce<Record<string, TermWithSemester[]>>((acc, term) => {
    if (!acc[term.semesterName]) acc[term.semesterName] = []
    acc[term.semesterName].push(term)
    return acc
  }, {})

  return (
    <div className="ml-7 border bg-muted/30 p-3 space-y-3 rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">{templateName}</span>
        </div>

        <div className="flex items-center gap-2">
          {panelMode === "view" && !isValid && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Dates not set
            </div>
          )}
          {panelMode === "edit" && !isValid && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Missing dates
            </div>
          )}
          {panelMode === "view" && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs gap-1"
              onClick={onEnterEdit}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      {panelMode === "view" ? (
        <div className="space-y-3">
          {Object.entries(grouped).map(([semName, terms]) => (
            <div key={semName} className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {semName}
              </p>
              <div className="space-y-1">
                {terms.map((term) => {
                  const d = termDates[term.id]
                  const hasDate = d?.startDate && d?.endDate

                  return (
                    <div
                      key={term.id}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-background border"
                    >
                      <span className="text-xs text-muted-foreground">{term.name}</span>
                      {hasDate ? (
                        <span className="text-xs tabular-nums">
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          Not set
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Close */}
          <div className="flex justify-end pt-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="space-y-2">
          {Object.entries(grouped).map(([semName, terms]) => (
            <div key={semName} className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {semName}
              </p>
              {terms.map((term) => {
                const d = termDates[term.id] ?? { startDate: "", endDate: "" }
                const termIdx = allTerms.findIndex((t) => t.id === term.id)
                const prevEndDate =
                  termIdx > 0 ? (termDates[allTerms[termIdx - 1].id]?.endDate ?? "") : ""

                return (
                  <TermDateRow
                    key={term.id}
                    term={term}
                    startDate={d.startDate}
                    endDate={d.endDate}
                    prevEndDate={prevEndDate}
                    syMin={syMin}
                    syMax={syMax}
                    onDateChange={onDateChange}
                  />
                )
              })}
            </div>
          ))}

          {/* Edit actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={onRequestSave}
              disabled={savingDates || !isValid}
            >
              {savingDates ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
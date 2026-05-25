// ===== File: frontend/src/components/admin/semester-settings/TermDatesPanelModal.tsx =====
"use client"

import { AlertCircle, Pencil, CalendarRange, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TermDateRow } from "../assign-row/term-date-row"
import type { TermDatesMap, TermWithSemester } from "../assign-row/types"
import type { PanelMode } from "../assign-row/use-assign-row"

interface TermDatesPanelModalProps {
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
  onSmartDateConfig?: () => void
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
  onSmartDateConfig,
}: TermDatesPanelModalProps) {
  // Group terms by semesterName for cleaner view
  const grouped = allTerms.reduce<Record<string, TermWithSemester[]>>((acc, term) => {
    if (!acc[term.semesterName]) acc[term.semesterName] = []
    acc[term.semesterName].push(term)
    return acc
  }, {})

  return (
    <div className="border bg-muted/30 p-4 space-y-4 rounded-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{templateName}</span>
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
              className="h-8 px-3 text-xs gap-1"
              onClick={onEnterEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Content */}
      {panelMode === "view" ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([semName, terms]) => (
            <div key={semName} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {semName}
              </p>
              <div className="space-y-2">
                {terms.map((term) => {
                  const d = termDates[term.id]
                  const hasDate = d?.startDate && d?.endDate

                  return (
                    <div
                      key={term.id}
                      className="flex items-center justify-between px-3 py-2 rounded bg-background border"
                    >
                      <span className="text-sm text-muted-foreground">{term.name}</span>
                      {hasDate ? (
                        <span className="text-sm tabular-nums font-medium">
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
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
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="space-y-4">
          {Object.entries(grouped).map(([semName, terms]) => (
            <div key={semName} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {semName}
              </p>
              <div className="space-y-3">
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
            </div>
          ))}

          {/* Smart date button */}
          {onSmartDateConfig && (
            <div className="flex items-center gap-2 pt-2">
              <Separator className="flex-1" />
              <span className="text-[11px] text-muted-foreground shrink-0">or</span>
              <Separator className="flex-1" />
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs gap-1.5 shrink-0"
                onClick={onSmartDateConfig}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto-Configure Dates
              </Button>
            </div>
          )}

          {/* Edit actions */}
          <div className="flex gap-2 pt-3 border-t">
            <Button
              size="sm"
              onClick={onRequestSave}
              disabled={savingDates || !isValid}
            >
              {savingDates ? "Saving…" : "Apply Template"}
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
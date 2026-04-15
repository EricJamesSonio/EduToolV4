"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CalendarDays, AlertCircle } from "lucide-react"
import type { AxiosError } from "axios"
import type { SemesterTemplate, TemplateAssignment, TermDate } from "@/types/admin/semester-template.types"
import { useAssignTemplate, useRemoveTemplateAssignment } from "@/hooks/admin/useSemesterTemplate"
import { semesterTemplateApi } from "@/api/admin/semester-template.api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Program {
  id: string
  name: string
  type: string
}

interface ProgramWithAssignment extends Program {
  semesterAssignment: TemplateAssignment | null
}

interface AssignRowProps {
  program: ProgramWithAssignment
  templates: SemesterTemplate[]
  schoolYearStart: string | null
  schoolYearEnd: string | null
}

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ?? "Something went wrong."

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

function clamp(date: string, min: string, max: string): string {
  if (min && date < min) return min
  if (max && date > max) return max
  return date
}

function addOneDay(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function AssignRow({ program, templates, schoolYearStart, schoolYearEnd }: AssignRowProps): React.JSX.Element {
  const assignMutation = useAssignTemplate()
  const removeMutation = useRemoveTemplateAssignment()
  const isPending = assignMutation.isPending || removeMutation.isPending

  const current = program.semesterAssignment
  const [expanded, setExpanded] = useState(false)
  const [savingDates, setSavingDates] = useState(false)

  // Build flat list of all terms from the assigned template
  const assignedTemplate = current
    ? templates.find((t) => t.id === current.template_id) ?? null
    : null

  const allTerms = assignedTemplate
    ? assignedTemplate.semesters.flatMap((sem) =>
        sem.terms.map((term) => ({ ...term, semesterName: sem.name }))
      )
    : []

  // term date state: termId → { startDate, endDate }
  const [termDates, setTermDates] = useState<Record<string, { startDate: string; endDate: string }>>({})

  useEffect(() => {
    if (!current?.termDates) return

    const init: Record<string, { startDate: string; endDate: string }> = {}

    for (const td of current.termDates) {
      init[td.term_id] = {
        startDate: toDateInput(td.start_date) ?? "",
        endDate: toDateInput(td.end_date) ?? "",
      }
    }

    setTermDates(init)
  }, [current?.termDates])

  const syMin = schoolYearStart ? toDateInput(schoolYearStart) : ""
  const syMax = schoolYearEnd ? toDateInput(schoolYearEnd) : ""

  const handleTemplateChange = (templateId: string | null) => {
    if (!templateId || templateId === "none") {
      if (!current) return
      removeMutation.mutate(program.id, {
        onSuccess: () => { toast.success("Assignment removed."); setTermDates({}); setExpanded(false) },
        onError: (e) => toast.error(errMsg(e)),
      })
    } else {
      assignMutation.mutate(
        { programId: program.id, templateId },
        {
          onSuccess: () => { toast.success("Template assigned. Set term dates to complete setup."); setExpanded(true) },
          onError: (e) => toast.error(errMsg(e)),
        }
      )
    }
  }

  const handleDateChange = (termId: string, field: "startDate" | "endDate", value: string) => {
    const clamped = clamp(value, syMin, syMax)
    setTermDates((prev) => {
      const updated = { ...prev, [termId]: { ...prev[termId], [field]: clamped } }

      // Smart default: if setting endDate of term N, set startDate of term N+1
      if (field === "endDate") {
        const idx = allTerms.findIndex((t) => t.id === termId)
        if (idx >= 0 && idx < allTerms.length - 1) {
          const nextTermId = allTerms[idx + 1].id!
          const nextStart = addOneDay(clamped)
          if (nextStart && (!updated[nextTermId]?.startDate)) {
            updated[nextTermId] = { startDate: nextStart, endDate: updated[nextTermId]?.endDate ?? "" }
          }
        }
      }

      return updated
    })
  }

  /**
   * Validates that all terms have complete dates
   * Returns { isValid: boolean, missingTerms: string[] }
   */
  const validateAllTermDates = (): { isValid: boolean; missingTerms: string[] } => {
    const missing: string[] = []
    
    for (const term of allTerms) {
      const dates = termDates[term.id!]
      const { startDate = "", endDate = "" } = dates || {}
      
      if (!startDate || !endDate) {
        missing.push(`${term.semesterName} · ${term.name}`)
      }
    }
    
    return {
      isValid: missing.length === 0,
      missingTerms: missing,
    }
  }

  /**
   * Validates individual term date rules
   */
  const validateTermDateRules = (
    payload: Array<{ termId: string; startDate: string; endDate: string }>
  ): { isValid: boolean; error: string | null } => {
    // startDate < endDate
    for (const p of payload) {
      if (p.startDate >= p.endDate) {
        return {
          isValid: false,
          error: `Invalid dates: start date must be before end date.`,
        }
      }
    }

    // Terms should be chronological (optional but nice)
    for (let i = 0; i < payload.length - 1; i++) {
      if (payload[i].endDate > payload[i + 1].startDate) {
        return {
          isValid: false,
          error: `Terms should not overlap. Check term order.`,
        }
      }
    }

    return { isValid: true, error: null }
  }

  /**
   * Gets the current validation status for the save button
   */
  const getValidationStatus = (): { isValid: boolean; message: string | null } => {
    const { isValid, missingTerms } = validateAllTermDates()
    
    if (!isValid) {
      return {
        isValid: false,
        message: `Missing dates for ${missingTerms.length} term(s)`,
      }
    }

    return { isValid: true, message: null }
  }

  const validationStatus = getValidationStatus()

  const handleSaveDates = async () => {
    // Step 1: Validate all terms have dates
    const validation = validateAllTermDates()
    if (!validation.isValid) {
      const missingList = validation.missingTerms.map((t) => `• ${t}`).join("\n")
      toast.error(
        `Cannot save: Missing dates for:\n${missingList}`,
        { duration: 4000 }
      )
      return
    }

    // Step 2: Build payload
    const payload = Object.entries(termDates)
      .filter(([, v]) => v.startDate && v.endDate)
      .map(([termId, v]) => ({ termId, startDate: v.startDate, endDate: v.endDate }))

    // Step 3: Validate date rules
    const ruleValidation = validateTermDateRules(payload)
    if (!ruleValidation.isValid) {
      toast.error(ruleValidation.error || "Invalid date configuration.")
      return
    }

    // Step 4: Save to backend
    setSavingDates(true)
    try {
      await semesterTemplateApi.saveTermDates(program.id, payload)
      toast.success("Term dates saved successfully!")
      setExpanded(false) // ← Auto-close after save
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingDates(false)
    }
  }

  return (
    <div className="py-2.5 px-1 space-y-2">
      {/* Main row */}
      <div className="flex items-center gap-3">
        {current ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
        )}
        <span className="text-sm font-medium min-w-0 flex-1 truncate">{program.name}</span>

        <div className="w-52 shrink-0">
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">No compatible templates</p>
          ) : (
            <Select value={current?.template_id ?? "none"} onValueChange={handleTemplateChange} disabled={isPending}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Assign template…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs text-muted-foreground">— None —</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {current && allTerms.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 shrink-0"
            onClick={() => setExpanded((v) => !v)}
            title="Set term dates"
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {expanded ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
          </Button>
        )}
      </div>

      {/* Term dates panel */}
      {expanded && current && allTerms.length > 0 && (
        <div className="ml-7 rounded-md border bg-muted/30 p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground font-medium">
              Set term dates
              {syMin && syMax && (
                <span className="ml-1 text-muted-foreground/60">(within {syMin} – {syMax})</span>
              )}
            </p>
            {!validationStatus.isValid && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{validationStatus.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {allTerms.map((term, idx) => {
              const dates = termDates[term.id!] || { startDate: "", endDate: "" }
              
              const prevEndDate = idx > 0 ? termDates[allTerms[idx - 1].id!]?.endDate : undefined
              const minStart = prevEndDate ? addOneDay(prevEndDate) : syMin
              const hasStartDate = !!dates.startDate
              const hasEndDate = !!dates.endDate
              const isComplete = hasStartDate && hasEndDate

              return (
                <div key={term.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end p-2 rounded border border-transparent hover:border-border/50 bg-background/50">
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-1 block font-medium">
                      {term.semesterName} · {term.name}
                      {!isComplete && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="flex gap-1.5 items-center">
                      <Input
                        type="date"
                        className={`h-7 text-xs ${!hasStartDate ? "border-amber-300 bg-amber-50/30" : ""}`}
                        value={dates.startDate ?? ""}

                        min={minStart || syMin}
                        max={syMax}
                        onChange={(e) => handleDateChange(term.id!, "startDate", e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">→</span>
                      <Input
                        type="date"
                        className={`h-7 text-xs ${!hasEndDate ? "border-amber-300 bg-amber-50/30" : ""}`}
                        value={dates.endDate ?? ""}
                        min={dates.startDate || syMin}
                        max={syMax}
                        onChange={(e) => handleDateChange(term.id!, "endDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSaveDates}
              disabled={savingDates || !validationStatus.isValid}
            >
              {savingDates ? "Saving…" : "Save dates"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
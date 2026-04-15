"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertCircle,
} from "lucide-react"

import type { AxiosError } from "axios"
import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types"

import {
  useAssignTemplate,
  useRemoveTemplateAssignment,
} from "@/hooks/admin/useSemesterTemplate"

import { semesterTemplateApi } from "@/api/admin/semester-template.api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/* ---------------- TYPES ---------------- */

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

/* ---------------- HELPERS ---------------- */

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong."

const toDateInput = (iso?: string | null): string =>
  iso ? iso.slice(0, 10) : ""

const addOneDay = (dateStr: string): string => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/* ---------------- COMPONENT ---------------- */

export function AssignRow({
  program,
  templates,
  schoolYearStart,
  schoolYearEnd,
}: AssignRowProps): React.JSX.Element {
  const assignMutation = useAssignTemplate()
  const removeMutation = useRemoveTemplateAssignment()

  const isPending = assignMutation.isPending || removeMutation.isPending
  const current = program.semesterAssignment

  const [expanded, setExpanded] = useState(false)
  const [savingDates, setSavingDates] = useState(false)

  const assignedTemplate = useMemo(() => {
    if (!current) return null
    return templates.find((t) => t.id === current.template_id) ?? null
  }, [current, templates])

  const allTerms = useMemo(() => {
    if (!assignedTemplate) return []
    return assignedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((term) => ({
        ...term,
        semesterName: sem.name,
      })),
    )
  }, [assignedTemplate])

  const syMin = schoolYearStart ? toDateInput(schoolYearStart) : ""
  const syMax = schoolYearEnd ? toDateInput(schoolYearEnd) : ""

  const [termDates, setTermDates] = useState<
    Record<string, { startDate: string; endDate: string }>
  >({})

  /* ---------------- INIT STATE ---------------- */

  useEffect(() => {
    if (!current?.termDates) return

    const init: Record<string, { startDate: string; endDate: string }> = {}

    for (const td of current.termDates) {
      if (!td.term_id) continue
      init[td.term_id] = {
        startDate: toDateInput(td.start_date),
        endDate: toDateInput(td.end_date),
      }
    }

    setTermDates(init)
  }, [current])

  /* ---------------- HANDLERS ---------------- */

  const handleTemplateChange = (templateId: string) => {
    if (templateId === "none") {
      if (!current) return

      removeMutation.mutate(program.id, {
        onSuccess: () => {
          toast.success("Assignment removed.")
          setTermDates({})
          setExpanded(false)
        },
        onError: (e) => toast.error(errMsg(e)),
      })

      return
    }

    assignMutation.mutate(
      { programId: program.id, templateId },
      {
        onSuccess: () => {
          toast.success("Template assigned.")
          setExpanded(true)
        },
        onError: (e) => toast.error(errMsg(e)),
      },
    )
  }

  const handleDateChange = (
    termId: string,
    field: "startDate" | "endDate",
    value: string,
  ) => {
    setTermDates((prev) => {
      const next = {
        ...prev,
        [termId]: {
          startDate: prev[termId]?.startDate ?? "",
          endDate: prev[termId]?.endDate ?? "",
          [field]: value,
        },
      }

      const idx = allTerms.findIndex((t) => t.id === termId)

      if (field === "endDate" && idx >= 0 && idx < allTerms.length - 1) {
        const nextTermId = allTerms[idx + 1].id
        const nextStart = addOneDay(value)

        if (nextTermId && nextStart) {
          next[nextTermId] = {
            startDate: nextStart,
            endDate: next[nextTermId]?.endDate ?? "",
          }
        }
      }

      return next
    })
  }

  /* ---------------- VALIDATION ---------------- */

  const validation = useMemo(() => {
    const missing: string[] = []

    for (const term of allTerms) {
      const d = termDates[term.id ?? ""]
      if (!d?.startDate || !d?.endDate) {
        missing.push(`${term.semesterName} · ${term.name}`)
      }
    }

    return {
      isValid: missing.length === 0,
      missing,
    }
  }, [termDates, allTerms])

  const validateRules = () => {
    const payload = Object.entries(termDates)
      .filter(([, v]) => v.startDate && v.endDate)
      .map(([termId, v]) => ({
        termId,
        startDate: v.startDate,
        endDate: v.endDate,
      }))

    for (const p of payload) {
      if (p.startDate >= p.endDate) {
        return { ok: false, msg: "Start date must be before end date." }
      }
    }

    for (let i = 0; i < payload.length - 1; i++) {
      if (payload[i].endDate > payload[i + 1].startDate) {
        return { ok: false, msg: "Terms must not overlap." }
      }
    }

    return { ok: true, msg: null }
  }

  const handleSaveDates = async () => {
    if (!validation.isValid) {
      toast.error("Please fill all term dates first.")
      return
    }

    const rule = validateRules()
    if (!rule.ok) {
      toast.error(rule.msg ?? "Invalid dates.")
      return
    }

    try {
      setSavingDates(true)

      await semesterTemplateApi.saveTermDates(program.id, validation.missing)

      toast.success("Term dates saved!")
      setExpanded(false)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingDates(false)
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="py-2.5 px-1 space-y-2">
      {/* ROW */}
      <div className="flex items-center gap-3">
        {current ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground/30" />
        )}

        <span className="text-sm font-medium flex-1 truncate">
          {program.name}
        </span>

        <div className="w-52">
          <Select
            value={current?.template_id ?? "none"}
            onValueChange={handleTemplateChange}
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

      {/* DETAILS */}
      {expanded && current && allTerms.length > 0 && (
        <div className="ml-7 border bg-muted/30 p-3 space-y-3 rounded-md">
          {/* header */}
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              Set term dates
            </p>

            {!validation.isValid && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                Missing dates
              </div>
            )}
          </div>

          {/* inputs */}
          <div className="space-y-2">
            {allTerms.map((term, idx) => {
              const d = termDates[term.id ?? ""] ?? {
                startDate: "",
                endDate: "",
              }

              const prevEnd =
                idx > 0
                  ? termDates[allTerms[idx - 1].id ?? ""]?.endDate
                  : ""

              const minStart = prevEnd ? addOneDay(prevEnd) : syMin

              return (
                <div
                  key={term.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 p-2 border rounded"
                >
                  <Label className="text-[10px]">
                    {term.semesterName} · {term.name}
                  </Label>

                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={d.startDate}
                    min={minStart || syMin}
                    max={syMax}
                    onChange={(e) =>
                      handleDateChange(term.id!, "startDate", e.target.value)
                    }
                  />

                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={d.endDate}
                    min={d.startDate || syMin}
                    max={syMax}
                    onChange={(e) =>
                      handleDateChange(term.id!, "endDate", e.target.value)
                    }
                  />
                </div>
              )
            })}
          </div>

          {/* actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveDates}
              disabled={savingDates || !validation.isValid}
            >
              {savingDates ? "Saving…" : "Save"}
            </Button>

            <Button
              size="sm"
              variant="outline"
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
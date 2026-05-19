"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { programCalendarApi } from "@/api/admin/program-calendar.api"
import { semesterTemplateApi } from "@/api/admin/semester-template.api"
import { useAssignTemplate, useRemoveTemplateAssignment } from "@/hooks/admin/useSemesterTemplate"
import type { SemesterTemplate } from "@/types/admin/semester-template.types"
import type { ProgramWithAssignment, TermDatesMap, TermWithSemester } from "./types"
import { errMsg, toDateInput, addOneDay } from "./helpers"

export type PanelMode = "view" | "edit"

export function useAssignRow(
  program: ProgramWithAssignment,
  templates: SemesterTemplate[],
) {
  const assignMutation = useAssignTemplate()
  const removeMutation = useRemoveTemplateAssignment()

  const isPending = assignMutation.isPending || removeMutation.isPending
  const current = program.semesterAssignment

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>("view")
  const [savingDates, setSavingDates] = useState(false)
  const [termDates, setTermDates] = useState<TermDatesMap>({})

  // Confirm dialogs
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)

  // Use the selected template (local selection takes priority over existing assignment)
  const assignedTemplate = useMemo(() => {
    const id = selectedTemplateId ?? current?.template_id
    if (!id || id === "none") return null
    return templates.find((t) => t.id === id) ?? null
  }, [current, selectedTemplateId, templates])

  const allTerms = useMemo<TermWithSemester[]>(() => {
    if (!assignedTemplate) return []
    return assignedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((term) => ({
        id: term.id ?? "",
        name: term.name,
        semesterName: sem.name,
      })),
    )
  }, [assignedTemplate])

  // Fetch calendar info for this program
  const { data: calendarInfo } = useQuery({
    queryKey: ["program-calendar", program.id, program.school_year_id],
    queryFn: () => programCalendarApi.getForProgram(program.id, program.school_year_id),
    enabled: !!program.school_year_id,
  })

  const calendarBreaks = calendarInfo?.breaks ?? []
  const calendarStart = calendarInfo?.startDate ?? ""
  const calendarEnd = calendarInfo?.endDate ?? ""

  // Filter templates to only those matching calendar break count
  const matchingTemplates = useMemo(() => {
    if (!calendarBreaks.length) return templates // If no calendar, show all
    const filtered = templates.filter((t) => t.semesters.length === calendarBreaks.length)
    // Always include currently assigned template so dropdown value stays valid
    if (current && !filtered.some((t) => t.id === current.template_id)) {
      const ct = templates.find((t) => t.id === current.template_id)
      if (ct) return [...filtered, ct]
    }
    return filtered
  }, [templates, calendarBreaks.length, current])

  // Has no calendar = can't assign (regardless of existing assignment)
  const hasNoCalendar = !calendarInfo

  // Init term dates from existing assignment
  useEffect(() => {
    if (!current?.termDates) {
      setTermDates({})
      return
    }
    const init: TermDatesMap = {}
    for (const td of current.termDates) {
      if (!td.term_id) continue
      init[td.term_id] = {
        startDate: toDateInput(td.start_date),
        endDate: toDateInput(td.end_date),
      }
    }
    setTermDates(init)
  }, [current])

  // Reset panel mode when collapsed
  useEffect(() => {
    if (!expanded) setPanelMode("view")
  }, [expanded])

  // Sync selectedTemplateId from existing assignment (one-time init)
  useEffect(() => {
    if (current && !selectedTemplateId) {
      setSelectedTemplateId(current.template_id)
    }
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Smart default computation when selecting a template ──

  const computeAndFillDefaults = useCallback(async (templateId: string) => {
    try {
      const defaults = await semesterTemplateApi.getDefaultTermDates(
        program.id,
        templateId,
      )
      const map: TermDatesMap = {}
      for (const d of defaults) {
        if (!d.termId) continue
        map[d.termId] = { startDate: d.startDate, endDate: d.endDate }
      }
      setTermDates(map)
      setPanelMode("edit")
    } catch {
      toast.error("Failed to compute default term dates.")
    }
  }, [program.id])

  // ── Apply assignment (with term dates) ──

  const applyAssignment = useCallback(async () => {
    if (!selectedTemplateId || selectedTemplateId === "none") return

    const payload = allTerms
      .filter((t) => termDates[t.id]?.startDate && termDates[t.id]?.endDate)
      .map((t) => ({
        termId: t.id,
        startDate: termDates[t.id].startDate,
        endDate: termDates[t.id].endDate,
      }))

    assignMutation.mutate(
      { programId: program.id, templateId: selectedTemplateId, termDates: payload },
      {
        onSuccess: () => {
          toast.success("Template assigned with term dates.")
          setPanelMode("view")
        },
        onError: (e) => {
          const msg = errMsg(e)
          toast.error(msg)
          // If the error is about no calendar, we can show it inline
        },
      },
    )
  }, [selectedTemplateId, allTerms, termDates, assignMutation, program.id])

  // ── Handle template selection ──

  const requestTemplateChange = (templateId: string) => {
    if (current && templateId !== current.template_id) {
      setPendingTemplateId(templateId)
      setConfirmOpen(true)
      return
    }
    applyTemplateChange(templateId)
  }

  const applyTemplateChange = (templateId: string) => {
    if (templateId === "none") {
      if (!current) return
      removeMutation.mutate(program.id, {
        onSuccess: () => {
          toast.success("Assignment removed.")
          setTermDates({})
          setExpanded(false)
          setSelectedTemplateId(null)
        },
        onError: (e) => toast.error(errMsg(e)),
      })
      return
    }

    // Don't assign immediately — just show smart defaults
    setSelectedTemplateId(templateId)
    setExpanded(true)
    computeAndFillDefaults(templateId)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    if (pendingTemplateId !== null) {
      applyTemplateChange(pendingTemplateId)
      setPendingTemplateId(null)
    }
  }

  const handleCancelConfirm = () => {
    setConfirmOpen(false)
    setPendingTemplateId(null)
  }

  // ── Date editing ──

  const handleDateChange = (
    termId: string,
    field: "startDate" | "endDate",
    value: string,
  ) => {
    setTermDates((prev) => {
      const next: TermDatesMap = {
        ...prev,
        [termId]: {
          startDate: prev[termId]?.startDate ?? "",
          endDate: prev[termId]?.endDate ?? "",
          [field]: value,
        },
      }

      if (field === "endDate") {
        const idx = allTerms.findIndex((t) => t.id === termId)
        if (idx >= 0 && idx < allTerms.length - 1) {
          const nextTermId = allTerms[idx + 1].id
          const nextStart = addOneDay(value)
          if (nextTermId && nextStart) {
            next[nextTermId] = {
              startDate: nextStart,
              endDate: next[nextTermId]?.endDate ?? "",
            }
          }
        }
      }

      return next
    })
  }

  const validation = useMemo(() => {
    const missing: string[] = []
    for (const term of allTerms) {
      const d = termDates[term.id]
      if (!d?.startDate || !d?.endDate) {
        missing.push(`${term.semesterName} · ${term.name}`)
      }
    }
    return { isValid: missing.length === 0, missing }
  }, [termDates, allTerms])

  const validateRules = (): { ok: boolean; msg: string | null } => {
    const payload = allTerms
      .map((t) => ({ termId: t.id, ...termDates[t.id] }))
      .filter((p) => p.startDate && p.endDate)

    for (const p of payload) {
      if (p.startDate >= p.endDate)
        return { ok: false, msg: "Start date must be before end date." }
    }
    for (let i = 0; i < payload.length - 1; i++) {
      if (payload[i].endDate > payload[i + 1].startDate)
        return { ok: false, msg: "Terms must not overlap." }
    }
    return { ok: true, msg: null }
  }

  const handleRequestSave = () => {
    if (!validation.isValid) {
      toast.error("Please fill all term dates first.")
      return
    }
    const rule = validateRules()
    if (!rule.ok) {
      toast.error(rule.msg ?? "Invalid dates.")
      return
    }
    if (!selectedTemplateId || selectedTemplateId === "none") {
      toast.error("No template selected.")
      return
    }
    setConfirmSaveOpen(true)
  }

  const handleSaveDates = async () => {
    setConfirmSaveOpen(false)
    await applyAssignment()
  }

  const handleCancelEdit = () => {
    if (current?.termDates) {
      const reset: TermDatesMap = {}
      for (const td of current.termDates) {
        if (!td.term_id) continue
        reset[td.term_id] = {
          startDate: toDateInput(td.start_date),
          endDate: toDateInput(td.end_date),
        }
      }
      setTermDates(reset)
    }
    setPanelMode("view")
  }

  return {
    // State
    current,
    selectedTemplateId: selectedTemplateId ?? current?.template_id ?? null,
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
    // Calendar info
    calendarInfo,
    hasNoCalendar,
    calendarBreaks,
    calendarStart,
    calendarEnd,
    matchingTemplates,
    // Template change confirm
    confirmOpen,
    handleConfirm,
    handleCancelConfirm,
    requestTemplateChange,
    // Date editing
    handleDateChange,
    handleRequestSave,
    handleSaveDates,
    handleCancelEdit,
    // Save confirm
    confirmSaveOpen,
    setConfirmSaveOpen,
  }
}

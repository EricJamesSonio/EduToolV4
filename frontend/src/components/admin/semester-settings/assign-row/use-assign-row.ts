// frontend/src/components/admin/semester-settings/assign-row/use-assign-row.ts
"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useAssignTemplate, useRemoveTemplateAssignment } from "@/hooks/admin/useSemesterTemplate"
import { semesterTemplateApi } from "@/api/admin/semester-template.api"
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

  const [expanded, setExpanded] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>("view")
  const [savingDates, setSavingDates] = useState(false)
  const [termDates, setTermDates] = useState<TermDatesMap>({})

  // Confirm dialogs
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)

  const assignedTemplate = useMemo(() => {
    if (!current) return null
    return templates.find((t) => t.id === current.template_id) ?? null
  }, [current, templates])

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

  /* ---------- Template change ---------- */

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
          setPanelMode("view")
        },
        onError: (e) => toast.error(errMsg(e)),
      },
    )
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

  /* ---------- Date editing ---------- */

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

  // Step 1: user clicks Save → open confirm dialog
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
    setConfirmSaveOpen(true)
  }

  // Step 2: user confirms → actually save
  const handleSaveDates = async () => {
    setConfirmSaveOpen(false)

    // Build correct payload — termId + startDate + endDate per term
    const termDatesPayload = allTerms
      .filter((t) => termDates[t.id]?.startDate && termDates[t.id]?.endDate)
      .map((t) => ({
        termId: t.id,
        startDate: termDates[t.id].startDate,
        endDate: termDates[t.id].endDate,
      }))

    try {
      setSavingDates(true)
      await semesterTemplateApi.saveTermDates(program.id, termDatesPayload)
      toast.success("Term dates saved!")
      setPanelMode("view")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingDates(false)
    }
  }

  const handleCancelEdit = () => {
    // Reset dates back to what came from server
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
    // template change confirm
    confirmOpen,
    handleConfirm,
    handleCancelConfirm,
    requestTemplateChange,
    // date editing
    handleDateChange,
    handleRequestSave,
    handleSaveDates,
    handleCancelEdit,
    // save confirm
    confirmSaveOpen,
    setConfirmSaveOpen,
  }
}
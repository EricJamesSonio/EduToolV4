// components/assign-row/use-assign-row.ts
"use client"

import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { useAssignTemplate, useRemoveTemplateAssignment } from "@/hooks/admin/useSemesterTemplate"
import { semesterTemplateApi } from "@/api/admin/semester-template.api"
import type { SemesterTemplate, TemplateAssignment } from "@/types/admin/semester-template.types"
import type { ProgramWithAssignment, TermDatesMap, TermWithSemester } from "./types"
import { errMsg, toDateInput, addOneDay } from "./helpers"

export function useAssignRow(
  program: ProgramWithAssignment,
  templates: SemesterTemplate[],
) {
  const assignMutation = useAssignTemplate()
  const removeMutation = useRemoveTemplateAssignment()

  const isPending = assignMutation.isPending || removeMutation.isPending
  const current = program.semesterAssignment

  const [expanded, setExpanded] = useState(false)
  const [savingDates, setSavingDates] = useState(false)
  const [termDates, setTermDates] = useState<TermDatesMap>({})

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)

  const assignedTemplate = useMemo(() => {
    if (!current) return null
    return templates.find((t) => t.id === current.template_id) ?? null
  }, [current, templates])

  const allTerms = useMemo<TermWithSemester[]>(() => {
    if (!assignedTemplate) return []
    return assignedTemplate.semesters.flatMap((sem) =>
      sem.terms.map((term) => ({
        ...term,
        semesterName: sem.name,
      })),
    )
  }, [assignedTemplate])

  // Init term dates from existing assignment
  useEffect(() => {
    if (!current?.termDates) return
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

  // Called when user picks a new template — ask for confirmation if already assigned
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
      const d = termDates[term.id ?? ""]
      if (!d?.startDate || !d?.endDate) {
        missing.push(`${term.semesterName} · ${term.name}`)
      }
    }
    return { isValid: missing.length === 0, missing }
  }, [termDates, allTerms])

  const validateRules = () => {
    const payload = Object.entries(termDates)
      .filter(([, v]) => v.startDate && v.endDate)
      .map(([termId, v]) => ({ termId, startDate: v.startDate, endDate: v.endDate }))

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

  return {
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
  }
}
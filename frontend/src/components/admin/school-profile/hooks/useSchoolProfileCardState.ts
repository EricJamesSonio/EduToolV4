import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigationGuard } from "@/context/NavigationGuardContext"
import type { ProgramType } from "@/types/admin/program.types"
import type { SchoolProfileDepartment } from "@/types/admin/school-profile.types"
import type { useSchoolProfileDraft } from "@/hooks/admin/useSchoolProfileDraft"

export type SchoolProfileCardMode = "view" | "edit"

/**
 * All the page-level UI state for SchoolProfileCard that isn't data-fetching:
 * view/edit mode (with its "discard unsaved changes?" gate), which
 * course/strand + level pill is expanded per department, the department
 * deselect confirmation, and the one-time auto-expand-first-level effect.
 *
 * Kept separate from SchoolProfileCard.tsx so that file stays focused on
 * composing components rather than juggling ~8 pieces of local state.
 */
export function useSchoolProfileCardState(
  draft: ReturnType<typeof useSchoolProfileDraft>,
  savedDepartments: SchoolProfileDepartment[],
  isLoading: boolean,
) {
  const hasSavedConfig = savedDepartments.length > 0

  const [mode, setMode] = useState<SchoolProfileCardMode>("view")

  // Default to View the first time a saved config is detected (e.g. after
  // the initial fetch resolves); never force it back to View on later
  // renders so an admin actively editing isn't kicked out mid-edit.
  const [modeInitialized, setModeInitialized] = useState(false)
  useEffect(() => {
    if (!modeInitialized && !isLoading) {
      setMode(hasSavedConfig ? "view" : "edit")
      setModeInitialized(true)
    }
  }, [modeInitialized, isLoading, hasSavedConfig])

  const readOnly = mode === "view"

  const [pendingDeselect, setPendingDeselect] = useState<ProgramType | null>(null)
  const [pendingMode, setPendingMode] = useState<SchoolProfileCardMode | null>(null)

  // Level-scoped accordion: single expanded course/strand and level per department.
  const [expandedCourseByDept, setExpandedCourseByDept] = useState<Record<string, string | null>>({})
  const [expandedLevelByDept, setExpandedLevelByDept] = useState<Record<string, string | null>>({})

  function toggleCourse(deptType: string, courseKey: string): void {
    setExpandedCourseByDept((prev) => {
      const cur = prev[deptType] ?? null
      const next = cur === courseKey ? null : courseKey
      return { ...prev, [deptType]: next }
    })
    setExpandedLevelByDept((prev) => ({ ...prev, [deptType]: null }))
  }

  function toggleLevel(deptType: string, levelKey: string): void {
    setExpandedLevelByDept((prev) => {
      const cur = prev[deptType] ?? null
      const next = cur === levelKey ? null : levelKey
      return { ...prev, [deptType]: next }
    })
  }

  const { setGuard } = useNavigationGuard()
  useEffect(() => {
    setGuard(() => !readOnly && draft.dirty)
    return () => setGuard(null)
  }, [draft.dirty, readOnly, setGuard])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!readOnly && draft.dirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [draft.dirty, readOnly])

  const savedTypes = useMemo(
    () => new Set(savedDepartments.map((d) => d.type as ProgramType)),
    [savedDepartments],
  )

  // View mode only ever shows departments that are actually saved/selected.
  // Edit mode shows every department (configured + untouched) via the
  // DepartmentStep toggle grid.
  const visibleDepartments = useMemo(() => {
    if (!readOnly) return Object.values(draft.departments)
    return Object.values(draft.departments).filter((d) => savedTypes.has(d.type))
  }, [readOnly, draft.departments, savedTypes])

  // Open the first course/strand + its first level automatically so the
  // Sections & Subjects editors are visible without hunting for a pill.
  // The ref guard makes this a one-time action per department: once the user
  // collapses a pill we must not fight them and re-expand it.
  const autoOpenedDepartments = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextCourses: Record<string, string> = {}
    const nextLevels: Record<string, string> = {}

    for (const dept of Object.values(draft.departments)) {
      if (autoOpenedDepartments.current.has(dept.type)) continue

      const groups =
        dept.type === "college" ? dept.courses : dept.type === "shs" ? dept.strands : []
      const firstGroup = groups[0]
      const levels = firstGroup ? firstGroup.levels : dept.levels

      if (firstGroup && expandedCourseByDept[dept.type] === undefined) {
        nextCourses[dept.type] = firstGroup.key
      }
      if (levels.length > 0 && expandedLevelByDept[dept.type] === undefined) {
        const sorted = [...levels].sort((a, b) => a.orderIndex - b.orderIndex)
        nextLevels[dept.type] = sorted[0].key
      }

      autoOpenedDepartments.current.add(dept.type)
    }

    if (Object.keys(nextCourses).length > 0) {
      setExpandedCourseByDept((prev) => ({ ...prev, ...nextCourses }))
    }
    if (Object.keys(nextLevels).length > 0) {
      setExpandedLevelByDept((prev) => ({ ...prev, ...nextLevels }))
    }
  }, [draft.departments, expandedCourseByDept, expandedLevelByDept])

  function handleToggleDepartment(type: ProgramType): void {
    if (readOnly) return
    if (draft.selectedTypes.has(type)) {
      setPendingDeselect(type)
    } else {
      draft.selectDepartment(type)
    }
  }

  function confirmDeselect(): void {
    if (!pendingDeselect) return
    draft.deselectDepartment(pendingDeselect)
    setPendingDeselect(null)
  }

  function requestModeChange(next: SchoolProfileCardMode): void {
    if (next === mode) return
    // Switching away from edit with unsaved changes discards edits.
    if (!readOnly && draft.dirty) {
      setPendingMode(next)
      return
    }
    setMode(next)
  }

  function confirmModeChange(): void {
    if (!pendingMode) return
    draft.discardChanges()
    setMode(pendingMode)
    setPendingMode(null)
  }

  return {
    mode,
    setMode,
    readOnly,
    hasSavedConfig,
    savedTypes,
    visibleDepartments,

    pendingDeselect,
    setPendingDeselect,
    confirmDeselect,

    pendingMode,
    setPendingMode,
    requestModeChange,
    confirmModeChange,

    expandedCourseByDept,
    expandedLevelByDept,
    toggleCourse,
    toggleLevel,

    handleToggleDepartment,
  }
}
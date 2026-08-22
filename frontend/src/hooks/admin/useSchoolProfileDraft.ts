import { useEffect, useMemo, useState } from "react"
import type { ProgramType } from "@/types/admin/program.types"
import type { SchoolProfileDepartment } from "@/types/admin/school-profile.types"
import {
  COLLEGE_COURSES,
  LEVEL_DEFS,
  SHS_STRANDS,
  SECTION_DEFAULTS,
  LEVEL_SUBJECTS,
  COURSE_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  COLLEGE_GE_SUBJECTS,
  SHS_MINOR_SUBJECTS,
} from "@/components/admin/data-seeder/constants/seed-data"

// ── Draft shapes (local-only, no ids until saved) ──────────────────────────

export interface DraftSection {
  key: string // stable local key, not a DB id
  name: string
  capacity: number
}

export interface DraftSubject {
  key: string
  name: string
  subjectType: "major" | "minor"
}

export interface DraftLevel {
  key: string
  name: string
  orderIndex: number
  sections: DraftSection[]
  subjects: DraftSubject[]
}

export interface DraftCourse {
  key: string
  name: string
  code: string | null
  levels: DraftLevel[]
}

export interface DraftStrand {
  key: string
  name: string
  levels: DraftLevel[]
}

export interface DraftDepartment {
  type: ProgramType
  courses: DraftCourse[]
  strands: DraftStrand[]
  levels: DraftLevel[] // department-level (non-course, non-strand)
  subjects: DraftSubject[] // department-level minor/shared subjects
}

let keyCounter = 0
function makeKey(prefix: string): string {
  keyCounter += 1
  return `${prefix}-${keyCounter}`
}

// ── Seeding a fresh draft department from predefined seeder data ───────────

function buildSectionsFor(levelName: string): DraftSection[] {
  return SECTION_DEFAULTS.map((s) => ({ key: makeKey("section"), name: s.name, capacity: s.capacity }))
}

function buildMajorSubjectsFor(levelName: string): DraftSubject[] {
  const names = LEVEL_SUBJECTS[levelName] ?? []
  return names.map((name) => ({ key: makeKey("subject"), name, subjectType: "major" as const }))
}

function buildPredefinedDepartment(type: ProgramType): DraftDepartment {
  if (type === "college") {
    const courses: DraftCourse[] = COLLEGE_COURSES.map((course) => ({
      key: makeKey("course"),
      name: course.name,
      code: course.code,
      levels: Array.from({ length: course.years }, (_, i) => {
        const levelName = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"][i] ?? `Year ${i + 1}`
        const majorNames = COURSE_SUBJECTS[course.code] ?? []
        return {
          key: makeKey("level"),
          name: levelName,
          orderIndex: i,
          sections: buildSectionsFor(levelName),
          subjects: majorNames
            .filter((n) => !COLLEGE_GE_SUBJECTS.includes(n as (typeof COLLEGE_GE_SUBJECTS)[number]))
            .map((name) => ({ key: makeKey("subject"), name, subjectType: "major" as const })),
        }
      }),
    }))

    const subjects: DraftSubject[] = COLLEGE_GE_SUBJECTS.map((name) => ({
      key: makeKey("subject"),
      name,
      subjectType: "minor" as const,
    }))

    return { type, courses, strands: [], levels: [], subjects }
  }

  if (type === "shs") {
    const strands: DraftStrand[] = SHS_STRANDS.map((strandName) => {
      const majorNames = (SHS_STRAND_SUBJECTS[strandName] ?? []).filter(
        (n) => !SHS_MINOR_SUBJECTS.includes(n as (typeof SHS_MINOR_SUBJECTS)[number]),
      )
      return {
        key: makeKey("strand"),
        name: strandName,
        levels: (LEVEL_DEFS["shs"] ?? []).map((levelName, i) => ({
          key: makeKey("level"),
          name: levelName,
          orderIndex: i,
          sections: buildSectionsFor(levelName),
          subjects: majorNames.map((name) => ({ key: makeKey("subject"), name, subjectType: "major" as const })),
        })),
      }
    })

    const subjects: DraftSubject[] = SHS_MINOR_SUBJECTS.map((name) => ({
      key: makeKey("subject"),
      name,
      subjectType: "minor" as const,
    }))

    return { type, courses: [], strands, levels: [], subjects }
  }

  // daycare / kinder / elementary / jhs — department-level only, no course/strand
  const levelNames = LEVEL_DEFS[type] ?? []
  const levels: DraftLevel[] = levelNames.map((levelName, i) => ({
    key: makeKey("level"),
    name: levelName,
    orderIndex: i,
    sections: buildSectionsFor(levelName),
    subjects: buildMajorSubjectsFor(levelName),
  }))

  return { type, courses: [], strands: [], levels, subjects: [] }
}

// ── Loading a draft from an already-saved profile ───────────────────────────

function fromSavedDepartment(saved: SchoolProfileDepartment): DraftDepartment {
  const toDraftLevel = (level: SchoolProfileDepartment["levels"][number]): DraftLevel => ({
    key: level.id,
    name: level.name,
    orderIndex: level.orderIndex,
    sections: level.sections.map((s) => ({ key: s.id, name: s.name, capacity: s.capacity })),
    subjects: level.subjects.map((s) => ({ key: s.id, name: s.name, subjectType: s.subjectType })),
  })

  return {
    type: saved.type,
    courses: saved.courses.map((c): DraftCourse => ({
      key: c.id,
      name: c.name,
      code: c.code,
      levels: c.levels.map((l) => toDraftLevel(l)),
    })),
    strands: saved.strands.map((s): DraftStrand => ({
      key: s.id,
      name: s.name,
      levels: s.levels.map((l) => toDraftLevel(l)),
    })),
    levels: saved.levels.map(toDraftLevel),
    subjects: saved.subjects.map((s): DraftSubject => ({
      key: s.id,
      name: s.name,
      subjectType: s.subjectType,
    })),
  }
}

// ── The hook ─────────────────────────────────────────────────────────────

export function useSchoolProfileDraft(savedDepartments: SchoolProfileDepartment[]) {
  const [departments, setDepartments] = useState<Record<string, DraftDepartment>>({})
  const [dirty, setDirty] = useState(false)

  const savedByType = useMemo(() => {
    const map = new Map<string, SchoolProfileDepartment>()
    savedDepartments.forEach((d) => map.set(d.type, d))
    return map
  }, [savedDepartments])

  // Keep draft in sync with server when the user has no unsaved edits.
  // This fixes the "saved config disappears after logout/relogin" illusion:
  // the old once-flag hydrated=true after the first empty fetch and never
  // re-hydrated when the profile query later resolved.
  useEffect(() => {
    if (dirty) return
    const initial: Record<string, DraftDepartment> = {}
    for (const saved of savedDepartments) {
      initial[saved.type] = fromSavedDepartment(saved)
    }
    setDepartments((prev) => {
      const prevKeys = Object.keys(prev).sort().join(",")
      const nextKeys = Object.keys(initial).sort().join(",")
      if (prevKeys !== nextKeys) return initial
      for (const k of Object.keys(initial)) {
        const a = prev[k]
        const b = initial[k]
        if (!a || JSON.stringify(a) !== JSON.stringify(b)) return initial
      }
      // Also handle case where server cleared config
      if (Object.keys(prev).length !== Object.keys(initial).length) return initial
      return prev
    })
  }, [savedDepartments, dirty])
  const selectedTypes = useMemo(() => new Set(Object.keys(departments) as ProgramType[]), [departments])

  function selectDepartment(type: ProgramType) {
    if (departments[type]) return
    const saved = savedByType.get(type)
    const draft = saved ? fromSavedDepartment(saved) : buildPredefinedDepartment(type)
    setDepartments((prev) => ({ ...prev, [type]: draft }))
    setDirty(true)
  }

  function deselectDepartment(type: ProgramType) {
    setDepartments((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setDirty(true)
  }

  function updateDepartment(type: ProgramType, updater: (dept: DraftDepartment) => DraftDepartment) {
    setDepartments((prev) => {
      const current = prev[type]
      if (!current) return prev
      return { ...prev, [type]: updater(current) }
    })
    setDirty(true)
  }

  // ── Course ──
  function addCourse(type: ProgramType, name: string) {
    updateDepartment(type, (d) => ({
      ...d,
      courses: [...d.courses, { key: makeKey("course"), name, code: null, levels: [] }],
    }))
  }
  function renameCourse(type: ProgramType, courseKey: string, name: string) {
    updateDepartment(type, (d) => ({
      ...d,
      courses: d.courses.map((c) => (c.key === courseKey ? { ...c, name } : c)),
    }))
  }
  function deleteCourse(type: ProgramType, courseKey: string) {
    updateDepartment(type, (d) => ({
      ...d,
      courses: d.courses.filter((c) => c.key !== courseKey),
    }))
  }

  // ── Strand ──
  function addStrand(type: ProgramType, name: string) {
    updateDepartment(type, (d) => ({
      ...d,
      strands: [...d.strands, { key: makeKey("strand"), name, levels: [] }],
    }))
  }
  function renameStrand(type: ProgramType, strandKey: string, name: string) {
    updateDepartment(type, (d) => ({
      ...d,
      strands: d.strands.map((s) => (s.key === strandKey ? { ...s, name } : s)),
    }))
  }
  function deleteStrand(type: ProgramType, strandKey: string) {
    updateDepartment(type, (d) => ({
      ...d,
      strands: d.strands.filter((s) => s.key !== strandKey),
    }))
  }

  // ── Level (parentKey is departmentType, courseKey, or strandKey) ──
  function addLevel(type: ProgramType, parentKey: string, name: string) {
    updateDepartment(type, (d) => {
      const newLevel: DraftLevel = { key: makeKey("level"), name, orderIndex: 0, sections: [], subjects: [] }
      if (parentKey === type) {
        return { ...d, levels: [...d.levels, { ...newLevel, orderIndex: d.levels.length }] }
      }
      return {
        ...d,
        courses: d.courses.map((c) =>
          c.key === parentKey ? { ...c, levels: [...c.levels, { ...newLevel, orderIndex: c.levels.length }] } : c,
        ),
        strands: d.strands.map((s) =>
          s.key === parentKey ? { ...s, levels: [...s.levels, { ...newLevel, orderIndex: s.levels.length }] } : s,
        ),
      }
    })
  }
  function renameLevel(type: ProgramType, levelKey: string, name: string) {
    const renameIn = (levels: DraftLevel[]) => levels.map((l) => (l.key === levelKey ? { ...l, name } : l))
    updateDepartment(type, (d) => ({
      ...d,
      levels: renameIn(d.levels),
      courses: d.courses.map((c) => ({ ...c, levels: renameIn(c.levels) })),
      strands: d.strands.map((s) => ({ ...s, levels: renameIn(s.levels) })),
    }))
  }
  function deleteLevel(type: ProgramType, levelKey: string) {
    const filterOut = (levels: DraftLevel[]) => levels.filter((l) => l.key !== levelKey)
    updateDepartment(type, (d) => ({
      ...d,
      levels: filterOut(d.levels),
      courses: d.courses.map((c) => ({ ...c, levels: filterOut(c.levels) })),
      strands: d.strands.map((s) => ({ ...s, levels: filterOut(s.levels) })),
    }))
  }

  // ── Section ──
  function withLevel(d: DraftDepartment, levelKey: string, fn: (l: DraftLevel) => DraftLevel): DraftDepartment {
    const mapLevels = (levels: DraftLevel[]) => levels.map((l) => (l.key === levelKey ? fn(l) : l))
    return {
      ...d,
      levels: mapLevels(d.levels),
      courses: d.courses.map((c) => ({ ...c, levels: mapLevels(c.levels) })),
      strands: d.strands.map((s) => ({ ...s, levels: mapLevels(s.levels) })),
    }
  }

  function addSection(type: ProgramType, levelKey: string, name: string, capacity: number) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({
        ...l,
        sections: [...l.sections, { key: makeKey("section"), name, capacity }],
      })),
    )
  }
  function updateSection(type: ProgramType, levelKey: string, sectionKey: string, name: string, capacity: number) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({
        ...l,
        sections: l.sections.map((s) => (s.key === sectionKey ? { ...s, name, capacity } : s)),
      })),
    )
  }
  function deleteSection(type: ProgramType, levelKey: string, sectionKey: string) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({ ...l, sections: l.sections.filter((s) => s.key !== sectionKey) })),
    )
  }

  // ── Subject (major, level-scoped) ──
  function addSubject(type: ProgramType, levelKey: string, name: string) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({
        ...l,
        subjects: [...l.subjects, { key: makeKey("subject"), name, subjectType: "major" as const }],
      })),
    )
  }
  function renameSubject(type: ProgramType, levelKey: string, subjectKey: string, name: string) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({
        ...l,
        subjects: l.subjects.map((s) => (s.key === subjectKey ? { ...s, name } : s)),
      })),
    )
  }
  function deleteSubject(type: ProgramType, levelKey: string, subjectKey: string) {
    updateDepartment(type, (d) =>
      withLevel(d, levelKey, (l) => ({ ...l, subjects: l.subjects.filter((s) => s.key !== subjectKey) })),
    )
  }

  function markSaved() {
    setDirty(false)
  }

  function discardChanges(): void {
    const initial: Record<string, DraftDepartment> = {}
    for (const saved of savedDepartments) {
      initial[saved.type] = fromSavedDepartment(saved)
    }
    setDepartments(initial)
    setDirty(false)
  }

  return {
    departments,
    selectedTypes,
    dirty,
    selectDepartment,
    deselectDepartment,
    addCourse,
    renameCourse,
    deleteCourse,
    addStrand,
    renameStrand,
    deleteStrand,
    addLevel,
    renameLevel,
    deleteLevel,
    addSection,
    updateSection,
    deleteSection,
    addSubject,
    renameSubject,
    deleteSubject,
    markSaved,
    discardChanges,
  }
}
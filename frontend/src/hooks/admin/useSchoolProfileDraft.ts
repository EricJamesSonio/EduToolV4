import { useEffect, useMemo, useState } from "react"
import type { ProgramType } from "@/types/admin/program.types"
import type {
  SchoolProfileDepartment,
  SchoolProfileGradingScale,
  SchoolProfileGradingScheme,
  SchoolProfileSemesterTermConfig,
  SchoolProfileData,
} from "@/types/admin/school-profile.types"
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
  GRADING_SCALE_PRESETS,
  GRADING_SCHEME_TEMPLATES,
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

export interface DraftGradingRange {
  key: string
  label: string
  minScore: number
  maxScore: number
  gradeValue: string
}

export interface DraftGradingScale {
  key: string
  programType: ProgramType
  name: string
  ranges: DraftGradingRange[]
}

export interface DraftSchemeComponent {
  key: string
  name: string
  type: string
  weight: number
  isOptional: boolean
}

export interface DraftGradingScheme {
  key: string
  programType: ProgramType
  name: string
  components: DraftSchemeComponent[]
}

export interface DraftSemesterTerm {
  key: string
  name: string
}

export interface DraftSemesterTermConfig {
  key: string
  programType: ProgramType
  terms: DraftSemesterTerm[]
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

// ── Grading / Semester predefined ──────────────────────────────────────────

function buildPredefinedGradingScale(programType: ProgramType): DraftGradingScale {
  const fallback = programType === "college" ? "college_5pt" : "deped_k12"
  const preset = GRADING_SCALE_PRESETS.find((p) => p.key === fallback) ?? GRADING_SCALE_PRESETS[0]
  return {
    key: makeKey("scale"),
    programType,
    name: preset.name,
    ranges: preset.ranges.map((r) => ({ key: makeKey("range"), label: r.label, minScore: r.minScore, maxScore: r.maxScore, gradeValue: r.gradeValue })),
  }
}

function buildPredefinedGradingScheme(programType: ProgramType): DraftGradingScheme {
  const tpl = GRADING_SCHEME_TEMPLATES.find((t) => t.programType === programType)
  if (!tpl) {
    return { key: makeKey("scheme"), programType, name: `${programType} Scheme`, components: [] }
  }
  return {
    key: makeKey("scheme"),
    programType,
    name: tpl.name,
    components: tpl.components.map((c) => ({ key: makeKey("comp"), name: c.name, type: c.type, weight: c.weight, isOptional: c.isOptional })),
  }
}

function buildPredefinedSemesterTerms(programType: ProgramType): DraftSemesterTermConfig {
  // College defaults to Prelim/Midterm/Finals, others generic Term 1/2/3
  const defaultTerms = programType === "college" ? ["Prelim", "Midterm", "Finals"] : ["Term 1", "Term 2", "Term 3"]
  return {
    key: makeKey("sem"),
    programType,
    terms: defaultTerms.map((name) => ({ key: makeKey("term"), name })),
  }
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

function fromSavedGradingScale(saved: SchoolProfileGradingScale): DraftGradingScale {
  return {
    key: saved.id,
    programType: saved.programType as ProgramType,
    name: saved.name,
    ranges: saved.ranges.map((r) => ({ key: makeKey("range"), label: r.label, minScore: r.minScore, maxScore: r.maxScore, gradeValue: r.gradeValue })),
  }
}

function fromSavedGradingScheme(saved: SchoolProfileGradingScheme): DraftGradingScheme {
  return {
    key: saved.id,
    programType: saved.programType as ProgramType,
    name: saved.name,
    components: saved.components.map((c) => ({ key: makeKey("comp"), name: c.name, type: c.type, weight: c.weight, isOptional: !!c.isOptional })),
  }
}

function fromSavedSemesterTerms(saved: SchoolProfileSemesterTermConfig): DraftSemesterTermConfig {
  return {
    key: saved.id,
    programType: saved.programType as ProgramType,
    terms: saved.terms.map((name) => ({ key: makeKey("term"), name })),
  }
}

// ── The hook ─────────────────────────────────────────────────────────────

type SavedInput = SchoolProfileDepartment[] | SchoolProfileData

function isSchoolProfileData(input: SavedInput): input is SchoolProfileData {
  return !Array.isArray(input) && typeof (input as any).departments !== "undefined"
}

export function useSchoolProfileDraft(savedInput: SavedInput) {
  const savedDepartments: SchoolProfileDepartment[] = isSchoolProfileData(savedInput) ? (savedInput.departments as SchoolProfileDepartment[]) : (savedInput as SchoolProfileDepartment[])
  const savedGradingScales: SchoolProfileGradingScale[] = isSchoolProfileData(savedInput) ? (savedInput.gradingScales as SchoolProfileGradingScale[]) : []
  const savedGradingSchemes: SchoolProfileGradingScheme[] = isSchoolProfileData(savedInput) ? (savedInput.gradingSchemes as SchoolProfileGradingScheme[]) : []
  const savedSemesterConfigs: SchoolProfileSemesterTermConfig[] = isSchoolProfileData(savedInput) ? (savedInput.semesterTermConfigs as SchoolProfileSemesterTermConfig[]) : []

  const [departments, setDepartments] = useState<Record<string, DraftDepartment>>({})
  const [gradingScales, setGradingScales] = useState<Record<string, DraftGradingScale>>({})
  const [gradingSchemes, setGradingSchemes] = useState<Record<string, DraftGradingScheme>>({})
  const [semesterConfigs, setSemesterConfigs] = useState<Record<string, DraftSemesterTermConfig>>({})
  const [dirty, setDirty] = useState(false)

  const savedByType = useMemo(() => {
    const map = new Map<string, SchoolProfileDepartment>()
    savedDepartments.forEach((d) => map.set(d.type, d))
    return map
  }, [savedDepartments])

  // Keep draft in sync with server when the user has no unsaved edits.
  useEffect(() => {
    if (dirty) return
    const initialDepts: Record<string, DraftDepartment> = {}
    for (const saved of savedDepartments) {
      initialDepts[saved.type] = fromSavedDepartment(saved)
    }
    setDepartments((prev) => {
      const prevKeys = Object.keys(prev).sort().join(",")
      const nextKeys = Object.keys(initialDepts).sort().join(",")
      if (prevKeys !== nextKeys) return initialDepts
      for (const k of Object.keys(initialDepts)) {
        const a = prev[k]
        const b = initialDepts[k]
        if (!a || JSON.stringify(a) !== JSON.stringify(b)) return initialDepts
      }
      if (Object.keys(prev).length !== Object.keys(initialDepts).length) return initialDepts
      return prev
    })

    const initialScales: Record<string, DraftGradingScale> = {}
    for (const s of savedGradingScales) {
      initialScales[s.programType] = fromSavedGradingScale(s)
    }
    setGradingScales((prev) => {
      const prevKeys = Object.keys(prev).sort().join(",")
      const nextKeys = Object.keys(initialScales).sort().join(",")
      if (prevKeys !== nextKeys) return initialScales
      for (const k of Object.keys(initialScales)) {
        const a = prev[k]
        const b = initialScales[k]
        if (!a || JSON.stringify(a) !== JSON.stringify(b)) return initialScales
      }
      if (Object.keys(prev).length !== Object.keys(initialScales).length) return initialScales
      return prev
    })

    const initialSchemes: Record<string, DraftGradingScheme> = {}
    for (const s of savedGradingSchemes) {
      initialSchemes[s.programType] = fromSavedGradingScheme(s)
    }
    setGradingSchemes((prev) => {
      const prevKeys = Object.keys(prev).sort().join(",")
      const nextKeys = Object.keys(initialSchemes).sort().join(",")
      if (prevKeys !== nextKeys) return initialSchemes
      for (const k of Object.keys(initialSchemes)) {
        const a = prev[k]
        const b = initialSchemes[k]
        if (!a || JSON.stringify(a) !== JSON.stringify(b)) return initialSchemes
      }
      if (Object.keys(prev).length !== Object.keys(initialSchemes).length) return initialSchemes
      return prev
    })

    const initialSem: Record<string, DraftSemesterTermConfig> = {}
    for (const c of savedSemesterConfigs) {
      initialSem[c.programType] = fromSavedSemesterTerms(c)
    }
    setSemesterConfigs((prev) => {
      const prevKeys = Object.keys(prev).sort().join(",")
      const nextKeys = Object.keys(initialSem).sort().join(",")
      if (prevKeys !== nextKeys) return initialSem
      for (const k of Object.keys(initialSem)) {
        const a = prev[k]
        const b = initialSem[k]
        if (!a || JSON.stringify(a) !== JSON.stringify(b)) return initialSem
      }
      if (Object.keys(prev).length !== Object.keys(initialSem).length) return initialSem
      return prev
    })
  }, [savedDepartments, savedGradingScales, savedGradingSchemes, savedSemesterConfigs, dirty])
  const selectedTypes = useMemo(() => new Set(Object.keys(departments) as ProgramType[]), [departments])

  function selectDepartment(type: ProgramType) {
    if (departments[type]) return
    const saved = savedByType.get(type)
    const draft = saved ? fromSavedDepartment(saved) : buildPredefinedDepartment(type)
    setDepartments((prev) => ({ ...prev, [type]: draft }))
    // Auto-create one-per-department grading/scheme/terms if not already present
    setGradingScales((prev) => {
      if (prev[type]) return prev
      const savedScale = savedGradingScales.find((s) => s.programType === type)
      const draftScale = savedScale ? fromSavedGradingScale(savedScale) : buildPredefinedGradingScale(type)
      return { ...prev, [type]: draftScale }
    })
    setGradingSchemes((prev) => {
      if (prev[type]) return prev
      const savedScheme = savedGradingSchemes.find((s) => s.programType === type)
      const draftScheme = savedScheme ? fromSavedGradingScheme(savedScheme) : buildPredefinedGradingScheme(type)
      return { ...prev, [type]: draftScheme }
    })
    setSemesterConfigs((prev) => {
      if (prev[type]) return prev
      const savedCfg = savedSemesterConfigs.find((c) => c.programType === type)
      const draftCfg = savedCfg ? fromSavedSemesterTerms(savedCfg) : buildPredefinedSemesterTerms(type)
      return { ...prev, [type]: draftCfg }
    })
    setDirty(true)
  }

  function deselectDepartment(type: ProgramType) {
    setDepartments((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setGradingScales((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setGradingSchemes((prev) => {
      const next = { ...prev }
      delete next[type]
      return next
    })
    setSemesterConfigs((prev) => {
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

  // ── Grading Scale ──
  function updateGradingScale(programType: ProgramType, patch: Partial<Pick<DraftGradingScale, "name">>) {
    setGradingScales((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, ...patch } }
    })
    setDirty(true)
  }
  function addGradingRange(programType: ProgramType, range: Omit<DraftGradingRange, "key">) {
    setGradingScales((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, ranges: [...cur.ranges, { key: makeKey("range"), ...range }] } }
    })
    setDirty(true)
  }
  function updateGradingRange(programType: ProgramType, rangeKey: string, patch: Partial<Omit<DraftGradingRange, "key">>) {
    setGradingScales((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, ranges: cur.ranges.map((r) => (r.key === rangeKey ? { ...r, ...patch } : r)) } }
    })
    setDirty(true)
  }
  function deleteGradingRange(programType: ProgramType, rangeKey: string) {
    setGradingScales((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, ranges: cur.ranges.filter((r) => r.key !== rangeKey) } }
    })
    setDirty(true)
  }

  // ── Grading Scheme ──
  function updateGradingScheme(programType: ProgramType, patch: Partial<Pick<DraftGradingScheme, "name">>) {
    setGradingSchemes((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, ...patch } }
    })
    setDirty(true)
  }
  function addSchemeComponent(programType: ProgramType, comp: Omit<DraftSchemeComponent, "key">) {
    setGradingSchemes((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, components: [...cur.components, { key: makeKey("comp"), ...comp }] } }
    })
    setDirty(true)
  }
  function updateSchemeComponent(programType: ProgramType, compKey: string, patch: Partial<Omit<DraftSchemeComponent, "key">>) {
    setGradingSchemes((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, components: cur.components.map((c) => (c.key === compKey ? { ...c, ...patch } : c)) } }
    })
    setDirty(true)
  }
  function deleteSchemeComponent(programType: ProgramType, compKey: string) {
    setGradingSchemes((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, components: cur.components.filter((c) => c.key !== compKey) } }
    })
    setDirty(true)
  }

  // ── Semester Terms ──
  function addSemesterTerm(programType: ProgramType, name: string) {
    setSemesterConfigs((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, terms: [...cur.terms, { key: makeKey("term"), name }] } }
    })
    setDirty(true)
  }
  function renameSemesterTerm(programType: ProgramType, termKey: string, name: string) {
    setSemesterConfigs((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, terms: cur.terms.map((t) => (t.key === termKey ? { ...t, name } : t)) } }
    })
    setDirty(true)
  }
  function deleteSemesterTerm(programType: ProgramType, termKey: string) {
    setSemesterConfigs((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      return { ...prev, [programType]: { ...cur, terms: cur.terms.filter((t) => t.key !== termKey) } }
    })
    setDirty(true)
  }
  function reorderSemesterTerms(programType: ProgramType, orderedKeys: string[]) {
    setSemesterConfigs((prev) => {
      const cur = prev[programType]
      if (!cur) return prev
      const byKey = new Map(cur.terms.map((t) => [t.key, t]))
      const reordered = orderedKeys.map((k) => byKey.get(k)!).filter(Boolean)
      return { ...prev, [programType]: { ...cur, terms: reordered } }
    })
    setDirty(true)
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
    const scales: Record<string, DraftGradingScale> = {}
    for (const s of savedGradingScales) scales[s.programType] = fromSavedGradingScale(s)
    setGradingScales(scales)
    const schemes: Record<string, DraftGradingScheme> = {}
    for (const s of savedGradingSchemes) schemes[s.programType] = fromSavedGradingScheme(s)
    setGradingSchemes(schemes)
    const sems: Record<string, DraftSemesterTermConfig> = {}
    for (const c of savedSemesterConfigs) sems[c.programType] = fromSavedSemesterTerms(c)
    setSemesterConfigs(sems)
    setDirty(false)
  }

  return {
    departments,
    gradingScales,
    gradingSchemes,
    semesterConfigs,
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
    updateGradingScale,
    addGradingRange,
    updateGradingRange,
    deleteGradingRange,
    updateGradingScheme,
    addSchemeComponent,
    updateSchemeComponent,
    deleteSchemeComponent,
    addSemesterTerm,
    renameSemesterTerm,
    deleteSemesterTerm,
    reorderSemesterTerms,
    markSaved,
    discardChanges,
  }
}

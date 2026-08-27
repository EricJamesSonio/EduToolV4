import { useEffect, useMemo, useRef, useState } from "react"
import type { CalendarBreak } from "@/api/admin/program-calendar.api"
import type { EffectiveSeedOverrides } from "./useEffectiveSeedData"
import {
  COLLEGE_COURSES,
  COLLEGE_YEAR_LABELS,
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  SHS_STRANDS,
  GRADING_SCALE_PRESETS,
  GRADING_SCHEME_TEMPLATES,
  SEMESTER_TEMPLATES,
  SECTION_DEFAULTS,
  generateLevelNames,
  getDefaultLevelNames,
  subjectKey,
  type GradingScalePreset,
} from "../constants/seed-data"

export interface ProgramLevelConfig {
  count: number
  names: string[]
}

export type SectionConfig = { name: string; capacity: number }[]

export interface ProgramCalendarDraft {
  startDate: string
  endDate: string
  notes: string
  breaks: CalendarBreak[]
}

/**
 * Minimum number of complete (start + end filled) calendar periods a
 * department needs before its calendar counts as "configured" and its
 * semester template can be derived from it. 2 periods = regular 2-semester
 * template, 3 periods = trimester, etc.
 */
export const MIN_CALENDAR_PERIODS = 2

/** Number of complete periods (breaks with both dates filled) in a draft. */
export function getBreakCount(config?: ProgramCalendarDraft): number {
  return config?.breaks.filter((b) => b.startDate && b.endDate).length ?? 0
}

/**
 * Whether a department's calendar draft is "configured" enough to derive a
 * semester template from — has its own date range and at least
 * MIN_CALENDAR_PERIODS complete periods.
 */
export function isCalendarConfigured(config?: ProgramCalendarDraft): boolean {
  return !!config?.startDate && !!config?.endDate && getBreakCount(config) >= MIN_CALENDAR_PERIODS
}

function defaultCalendarBreaks(startDate: string): CalendarBreak[] {
  return [
    { label: "Break 1", startDate, endDate: "" },
    { label: "Break 2", startDate: "", endDate: "" },
  ]
}

function emptyProgramCalendarDraft(): ProgramCalendarDraft {
  return { startDate: "", endDate: "", notes: "", breaks: defaultCalendarBreaks("") }
}

const DEFAULT_PRESET_PER_PROGRAM: Record<string, string> = {
  daycare: "deped_k12",
  kinder: "deped_k12",
  elementary: "deped_k12",
  jhs: "deped_k12",
  shs: "deped_k12",
  college: "college_5pt",
}

function buildInitialSectionConfigs(overrides?: EffectiveSeedOverrides): Record<string, SectionConfig> {
  const out: Record<string, SectionConfig> = {}

  Object.entries(LEVEL_DEFS).forEach(([, names]) => {
    names.forEach((levelName) => {
      out[levelName] = overrides?.sectionsByLevelName?.[levelName]?.map((s) => ({ ...s }))
        ?? SECTION_DEFAULTS.map((s) => ({ ...s }))
    })
  })

  if (overrides) {
    Object.entries(overrides.levelDefsByEntity).forEach(([, names]) => {
      names.forEach((levelName) => {
        if (!out[levelName]) {
          out[levelName] = overrides.sectionsByLevelName?.[levelName]?.map((s) => ({ ...s }))
            ?? SECTION_DEFAULTS.map((s) => ({ ...s }))
        } else if (overrides.sectionsByLevelName?.[levelName]) {
          out[levelName] = overrides.sectionsByLevelName[levelName].map((s) => ({ ...s }))
        }
      })
    })
    Object.entries(overrides.sectionsByLevelName).forEach(([levelName, sections]) => {
      if (!out[levelName]) out[levelName] = sections.map((s) => ({ ...s }))
    })
  }

  return out
}

function buildInitialGradingSchemesByProgram(): Record<string, boolean> {
  const out: Record<string, boolean> = {}

  GRADING_SCHEME_TEMPLATES.forEach((scheme) => {
    out[scheme.programType] = false
  })

  return out
}

function buildInitialSemesterTemplatesByProgram(): Record<string, boolean> {
  const out: Record<string, boolean> = {}

  SEMESTER_TEMPLATES.forEach((tpl) => {
    out[tpl.programType] = false
  })

  return out
}

function buildInitialGradingScaleByProgram(): Record<string, string> {
  return {}
}

function buildInitialLevelConfigs(): Record<string, ProgramLevelConfig> {
  return {}
}

export function useSeedState(overrides?: EffectiveSeedOverrides) {
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  // ===== LEVEL CONFIGS (NOT AUTO-SELECTED) =====
  const [levelConfigs, setLevelConfigs] = useState<Record<string, ProgramLevelConfig>>(
    buildInitialLevelConfigs,
  )

  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>(
    () => buildInitialSectionConfigs(overrides),
  )

  // ===== LEVEL/SECTION SELECTION (read-only seeder: reduce/bring back) =====
  const [selectedLevelKeys, setSelectedLevelKeys] = useState<Set<string>>(new Set())
  const [selectedSectionKeys, setSelectedSectionKeys] = useState<Set<string>>(new Set())

  // Merge in override sections that arrived after initial mount (profile loads async).
  // Only adds missing keys so we never clobber a user-edited section config.
  useEffect(() => {
    if (!overrides) return
    setSectionConfigs((prev) => {
      const next = { ...prev }
      let changed = false
      Object.entries(overrides.sectionsByLevelName).forEach(([levelName, sections]) => {
        if (!next[levelName]) {
          next[levelName] = sections.map((s) => ({ ...s }))
          changed = true
        }
      })
      Object.values(overrides.levelDefsByEntity).flat().forEach((levelName) => {
        if (!next[levelName]) {
          next[levelName] = overrides.sectionsByLevelName[levelName]?.map((s) => ({ ...s }))
            ?? SECTION_DEFAULTS.map((s) => ({ ...s }))
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [overrides])

  // ===== COURSES & STRANDS (NOT AUTO-SELECTED) =====
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  const [selectedStrands, setSelectedStrands] = useState<Set<string>>(new Set())

  // ===== SUBJECTS (NOT AUTO-SELECTED) =====
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())

  const toLevelKey = (entityKey: string, levelName: string): string => `${entityKey}::${levelName}`
  const toSectionKey = (levelKey: string, sectionName: string): string => `${levelKey}::${sectionName}`

  const allLevelKeys = useMemo(() => {
    const keys = new Set<string>()
    selectedPrograms.forEach((prog) => {
      if (prog === "college") {
        selectedCourses.forEach((code) => {
          const effLevels = overrides?.levelDefsByEntity?.[code] ?? getDefaultLevelNames(code)
          effLevels.forEach((lvl) => keys.add(toLevelKey(code, lvl)))
        })
      } else if (prog === "shs") {
        selectedStrands.forEach((strand) => {
          const effLevels = overrides?.levelDefsByEntity?.[strand] ?? LEVEL_DEFS["shs"] ?? []
          effLevels.forEach((lvl) => keys.add(toLevelKey(strand, lvl)))
        })
      } else {
        const effLevels = overrides?.levelDefsByEntity?.[prog] ?? LEVEL_DEFS[prog] ?? []
        const names = levelConfigs[prog]?.names ?? effLevels
        names.forEach((lvl) => keys.add(toLevelKey(prog, lvl)))
      }
    })
    return keys
  }, [selectedPrograms, selectedCourses, selectedStrands, overrides, levelConfigs])

  const allSectionKeys = useMemo(() => {
    const keys = new Set<string>()
    allLevelKeys.forEach((levelKey) => {
      const [, levelName] = levelKey.split("::")
      if (!levelName) return
      const sections = sectionConfigs[levelName] ?? overrides?.sectionsByLevelName?.[levelName] ?? SECTION_DEFAULTS
      sections.forEach((s) => keys.add(toSectionKey(levelKey, s.name)))
    })
    return keys
  }, [allLevelKeys, sectionConfigs, overrides])

  const prevAllLevelKeysRef = useRef<Set<string>>(new Set())
  const prevAllSectionKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const prev = prevAllLevelKeysRef.current
    const added = new Set<string>()
    for (const k of allLevelKeys) if (!prev.has(k)) added.add(k)
    if (added.size > 0 || prev.size !== allLevelKeys.size) {
      setSelectedLevelKeys((prevSel) => {
        const next = new Set(prevSel)
        for (const k of added) next.add(k)
        for (const k of Array.from(next)) if (!allLevelKeys.has(k)) next.delete(k)
        if (prev.size === 0 && next.size === 0 && allLevelKeys.size > 0) {
          return new Set(allLevelKeys)
        }
        return next
      })
    }
    prevAllLevelKeysRef.current = new Set(allLevelKeys)
  }, [allLevelKeys])

  useEffect(() => {
    const prev = prevAllSectionKeysRef.current
    const added = new Set<string>()
    for (const k of allSectionKeys) if (!prev.has(k)) added.add(k)
    if (added.size > 0 || prev.size !== allSectionKeys.size) {
      setSelectedSectionKeys((prevSel) => {
        const next = new Set(prevSel)
        for (const k of added) next.add(k)
        for (const k of Array.from(next)) if (!allSectionKeys.has(k)) next.delete(k)
        if (prev.size === 0 && next.size === 0 && allSectionKeys.size > 0) {
          return new Set(allSectionKeys)
        }
        return next
      })
    }
    prevAllSectionKeysRef.current = new Set(allSectionKeys)
  }, [allSectionKeys])

  function toggleLevelKey(key: string): void {
    setSelectedLevelKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSectionKey(key: string): void {
    setSelectedSectionKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allSelectableSubjects = useMemo(() => {
    const out = new Set<string>()

    const effectiveLevelDefs = (prog: string): string[] | undefined =>
      overrides?.levelDefsByEntity?.[prog] ?? LEVEL_DEFS[prog]
    const getLevelSubjects = (lvl: string): string[] | undefined =>
      overrides?.levelSubjectsByLevelName?.[lvl] ?? LEVEL_SUBJECTS[lvl]
    const getCourseSubjects = (code: string): string[] | undefined =>
      overrides?.courseSubjectsByCode?.[code] ?? COURSE_SUBJECTS[code]
    const getStrandSubjects = (name: string): string[] | undefined =>
      overrides?.strandSubjectsByName?.[name] ?? SHS_STRAND_SUBJECTS[name]
    const isLevelSelectedForSubject = (entityKey: string, levelName: string): boolean => {
      if (selectedLevelKeys.size === 0) return true
      return selectedLevelKeys.has(toLevelKey(entityKey, levelName))
    }

    selectedPrograms.forEach((prog) => {
      const effLevels = effectiveLevelDefs(prog)
      if (effLevels) {
        const levelNames = levelConfigs[prog]?.names ?? effLevels
        levelNames.forEach((lvl) => {
          if (!isLevelSelectedForSubject(prog, lvl)) return
          getLevelSubjects(lvl)?.forEach((s) => {
            out.add(subjectKey(lvl, s))
          })
        })
      }

      if (prog === "shs") {
        selectedStrands.forEach((strand) => {
          getStrandSubjects(strand)?.forEach((s) => {
            out.add(subjectKey(strand, s))
          })
        })
      }

      if (prog === "college") {
        selectedCourses.forEach((code) => {
          getCourseSubjects(code)?.forEach((s) => {
            out.add(subjectKey(code, s))
          })
        })
      }
    })

    return Array.from(out)
  }, [selectedPrograms, levelConfigs, selectedStrands, selectedCourses, overrides])

  useEffect(() => {
    setSelectedSubjects((prev) => {
      const valid = new Set(allSelectableSubjects)

      const cleaned = new Set([...prev].filter((s) => valid.has(s)))

      return cleaned.size === prev.size ? prev : cleaned
    })
  }, [allSelectableSubjects])

  // ===== GRADING SCALES (NOT AUTO-SELECTED) =====
  const [seedGradingScale, setSeedGradingScale] = useState(false)

  const [gradingScaleByProgram, setGradingScaleByProgram] =
    useState<Record<string, string>>(buildInitialGradingScaleByProgram)

  function setGradingScaleForProgram(prog: string, presetKey: string) {
    setGradingScaleByProgram((prev) => ({
      ...prev,
      [prog]: presetKey,
    }))
  }
const resolvedGradingScales = useMemo((): Record<string, GradingScalePreset> => {
  const out: Record<string, GradingScalePreset> = {}

  Array.from(selectedPrograms).forEach((prog) => {
    const overrideScale = overrides?.gradingScalesByProgram?.[prog]
    if (overrideScale) {
      out[prog] = overrideScale
      return
    }
    // Fall back to the first preset — matches what GradingScaleStep shows
    // as selected by default, so what's actually seeded always matches
    // what the admin saw selected in the UI.
    const key = gradingScaleByProgram[prog] ?? GRADING_SCALE_PRESETS[0].key
    const preset = GRADING_SCALE_PRESETS.find((p) => p.key === key)
    if (preset) out[prog] = preset
  })

  return out
}, [selectedPrograms, gradingScaleByProgram, overrides])

  // ===== GRADING SCHEMES (NOT AUTO-SELECTED) =====
  const [seedGradingSchemes, setSeedGradingSchemes] = useState(false)

  const [gradingSchemesByProgram, setGradingSchemesByProgram] =
    useState<Record<string, boolean>>(buildInitialGradingSchemesByProgram)

  function toggleGradingScheme(programType: string, enabled: boolean) {
    setGradingSchemesByProgram((prev) => ({
      ...prev,
      [programType]: enabled,
    }))
  }

  function toggleSeedGradingSchemes(enabled: boolean) {
    setSeedGradingSchemes(enabled)
    if (enabled) {
      // Selecting the master "Grading Scheme Templates" toggle auto-selects
      // every applicable program scheme so no extra per-program clicks are needed.
      setGradingSchemesByProgram((prev) => {
        const next = { ...prev }
        if (overrides?.gradingSchemesByProgram) {
          Object.keys(overrides.gradingSchemesByProgram).forEach((k) => {
            next[k] = true
          })
        } else {
          GRADING_SCHEME_TEMPLATES.forEach((tpl) => {
            next[tpl.programType] = true
          })
        }
        return next
      })
    }
  }

  // ===== SEMESTER TEMPLATES (NOT AUTO-SELECTED) =====
  const [seedSemesterTemplates, setSeedSemesterTemplates] = useState(false)

  const [semesterTemplatesByProgram, setSemesterTemplatesByProgram] =
    useState<Record<string, boolean>>(buildInitialSemesterTemplatesByProgram)

  function toggleSemesterTemplate(programType: string, enabled: boolean) {
    setSemesterTemplatesByProgram((prev) => ({
      ...prev,
      [programType]: enabled,
    }))
  }

  function toggleSeedSemesterTemplates(enabled: boolean) {
    setSeedSemesterTemplates(enabled)
    if (enabled) {
      // Selecting the master "Semester Templates" toggle auto-selects every
      // applicable program *whose academic calendar is already configured*
      // (>= MIN_CALENDAR_PERIODS complete periods). Departments without a
      // configured calendar yet are left off until their calendar is set up —
      // otherwise we'd be auto-selecting a template we can't actually derive.
      setSemesterTemplatesByProgram((prev) => {
        const next = { ...prev }
        const source = overrides?.semesterTermNamesByProgram
          ? Object.keys(overrides.semesterTermNamesByProgram).map((k) => ({ programType: k }))
          : SEMESTER_TEMPLATES
        source.forEach((tpl: any) => {
          next[tpl.programType] = isCalendarConfigured(programCalendarConfigs[tpl.programType])
        })
        return next
      })
    }
  }

  // ===== PROGRAM CALENDARS (NOT AUTO-SELECTED — optional, like the others) =====
  const [seedProgramCalendars, setSeedProgramCalendars] = useState(false)

  const [programCalendarConfigs, setProgramCalendarConfigs] =
    useState<Record<string, ProgramCalendarDraft>>({})

  function toggleSeedProgramCalendars(enabled: boolean) {
    setSeedProgramCalendars(enabled)
    if (enabled) {
      // Auto-on per program: every selected department gets a calendar draft so
      // no extra per-program clicks are needed.
      setProgramCalendarConfigs((prev) => {
        const next = { ...prev }
        selectedPrograms.forEach((prog) => {
          if (!next[prog]) next[prog] = emptyProgramCalendarDraft()
        })
        return next
      })
    }
  }

  /** Seed a draft for a program and prefill empty school-year dates. */
  function initProgramCalendar(prog: string, defaults: Partial<ProgramCalendarDraft>) {
    setProgramCalendarConfigs((prev) => {
      const existing = prev[prog]
      if (existing?.startDate && existing?.endDate) return prev
      const base = existing ?? emptyProgramCalendarDraft()
      const startDate = base.startDate || (defaults.startDate ?? "")
      return {
        ...prev,
        [prog]: {
          ...base,
          startDate,
          endDate: base.endDate || (defaults.endDate ?? ""),
          breaks:
            base.breaks.length > 0
              ? base.breaks.map((b, i) => (i === 0 ? { ...b, startDate } : b))
              : defaultCalendarBreaks(startDate),
        },
      }
    })
  }

  function updateProgramCalendar(prog: string, patch: Partial<ProgramCalendarDraft>) {
    setProgramCalendarConfigs((prev) => {
      const current = prev[prog] ?? emptyProgramCalendarDraft()
      return { ...prev, [prog]: { ...current, ...patch } }
    })
  }

  // Keep semester templates in sync with the academic calendar: if the
  // calendar step is turned off entirely, or a specific department's
  // calendar no longer meets the minimum period count (e.g. the user deleted
  // a break after enabling the template), its semester template can't stay
  // selected — otherwise the two would silently drift apart, which is the
  // exact bug this whole sync exists to prevent.
  useEffect(() => {
    if (!seedProgramCalendars) {
      if (seedSemesterTemplates) setSeedSemesterTemplates(false)
      return
    }
    setSemesterTemplatesByProgram((prev) => {
      let changed = false
      const next = { ...prev }
      Object.keys(next).forEach((prog) => {
        if (next[prog] && !isCalendarConfigured(programCalendarConfigs[prog])) {
          next[prog] = false
          changed = true
        }
      })
      return changed ? next : prev
    })
   
  }, [seedProgramCalendars, programCalendarConfigs, seedSemesterTemplates])

  // ===== LEVEL & SECTION MANAGEMENT =====
  function resolveEntityLevelNames(entityKey: string, count: number): string[] {
    const overrideNames = overrides?.levelDefsByEntity?.[entityKey]
    if (overrideNames) {
      if (count <= overrideNames.length) return overrideNames.slice(0, count)
      const extraCount = count - overrideNames.length
      const generated = generateLevelNames(entityKey, count)
      return [...overrideNames, ...generated.slice(overrideNames.length, overrideNames.length + extraCount)]
    }
    // College course override may carry custom year count via collegeCourses
    if (overrides?.collegeCourses) {
      const oc = overrides.collegeCourses.find((c) => c.code === entityKey)
      if (oc) {
        const base = overrides.levelDefsByEntity[entityKey] ?? COLLEGE_YEAR_LABELS
        return base.slice(0, count)
      }
    }
    const course = COLLEGE_COURSES.find((c) => c.code === entityKey);
    if (course) {
      const base = overrides?.levelDefsByEntity?.[entityKey] ?? COLLEGE_YEAR_LABELS
      return base.slice(0, count);
    }
    if (
      SHS_STRANDS.includes(entityKey) ||
      !!overrides?.shsStrands?.includes(entityKey) ||
      !!overrides?.levelDefsByEntity?.[entityKey]
    ) {
      const base = overrides?.levelDefsByEntity?.[entityKey] ?? LEVEL_DEFS["shs"] ?? []
      return base.slice(0, count)
    }
    if (overrides?.levelDefsByEntity?.[entityKey]) return overrides.levelDefsByEntity[entityKey].slice(0, count)
    return generateLevelNames(entityKey, count);
  }

  function setLevelCount(prog: string, count: number) {
    setLevelConfigs((prev) => {
      const existing = prev[prog] ?? { count: 0, names: [] }

      const newNames = resolveEntityLevelNames(prog, count)

      const defaultAtOldCount = resolveEntityLevelNames(prog, existing.count)
      const merged = newNames.map((defaultName, i) => {
        const oldName = existing.names[i]
        const wasCustomized = oldName && oldName !== defaultAtOldCount[i]
        return wasCustomized ? oldName : defaultName
      })

      return {
        ...prev,
        [prog]: {
          count,
          names: merged,
        },
      }
    })
  }

  function renameLevelAt(prog: string, index: number, newName: string) {
    setLevelConfigs((prev) => {
      const existing = prev[prog]

      if (!existing) return prev

      const names = [...existing.names]

      const oldName = names[index]

      names[index] = newName

      setSectionConfigs((prevSec) => {
        const next = { ...prevSec }

        const current =
          next[oldName]
            ?? overrides?.sectionsByLevelName?.[oldName]?.map((s) => ({ ...s }))
            ?? SECTION_DEFAULTS.map((s) => ({ ...s }))

        delete next[oldName]

        next[newName] = current

        return next
      })

      return {
        ...prev,
        [prog]: {
          ...existing,
          names,
        },
      }
    })
  }

  function renameLevelSections(levelName: string, sections: SectionConfig) {
    setSectionConfigs((prev) => ({
      ...prev,
      [levelName]: sections,
    }))
  }

  // ===== RESET =====
  function resetAll() {
    setSelectedPrograms(new Set())
    setSelectedCourses(new Set())
    setSelectedStrands(new Set())
    setSelectedSubjects(new Set())
    setSelectedLevelKeys(new Set())
    setSelectedSectionKeys(new Set())
    setLevelConfigs(buildInitialLevelConfigs())
    setSectionConfigs(buildInitialSectionConfigs(overrides))
    setSeedGradingScale(false)
    setGradingScaleByProgram(buildInitialGradingScaleByProgram())
    setSeedGradingSchemes(false)
    setGradingSchemesByProgram(buildInitialGradingSchemesByProgram())
    setSeedSemesterTemplates(false)
    setSemesterTemplatesByProgram(buildInitialSemesterTemplatesByProgram())
    setSeedProgramCalendars(false)
    setProgramCalendarConfigs({})
  }

  // ===== UTILITY FUNCTIONS =====
  function toggleSet(
    set: Set<string>,
    key: string,
    setter: (s: Set<string>) => void,
  ) {
    const next = new Set(set)

    if (next.has(key)) next.delete(key)
    else next.add(key)

    setter(next)
  }

  function selectAll(
    keys: string[],
    setter: (s: Set<string>) => void,
  ) {
    setter(new Set(keys))
  }

  function deselectAll(
    setter: (s: Set<string>) => void,
  ) {
    setter(new Set())
  }

  return {
    // Programs & Structure
    selectedPrograms,
    setSelectedPrograms,

    selectedCourses,
    setSelectedCourses,

    selectedStrands,
    setSelectedStrands,

    selectedSubjects,
    setSelectedSubjects,

    allSelectableSubjects,

    // Levels & Sections
    levelConfigs,
    setLevelCount,
    renameLevelAt,

    sectionConfigs,
    setSectionsForLevel: renameLevelSections,

    // Level/Section selection (read-only seeder)
    selectedLevelKeys,
    setSelectedLevelKeys,
    selectedSectionKeys,
    setSelectedSectionKeys,
    allLevelKeys,
    allSectionKeys,
    toLevelKey,
    toSectionKey,
    toggleLevelKey,
    toggleSectionKey,

    // Grading Scales
    seedGradingScale,
    setSeedGradingScale,

    gradingScaleByProgram,
    setGradingScaleForProgram,

    resolvedGradingScales,

    // Grading Schemes
    seedGradingSchemes,
    setSeedGradingSchemes: toggleSeedGradingSchemes,

    gradingSchemesByProgram,
    toggleGradingScheme,

    // Semester Templates
    seedSemesterTemplates,
    setSeedSemesterTemplates: toggleSeedSemesterTemplates,

    semesterTemplatesByProgram,
    toggleSemesterTemplate,

    // Program Calendars
    seedProgramCalendars,
    setSeedProgramCalendars: toggleSeedProgramCalendars,

    programCalendarConfigs,
    initProgramCalendar,
    updateProgramCalendar,

    // Utilities
    resetAll,
    toggleSet,
    selectAll,
    deselectAll,
  }
}
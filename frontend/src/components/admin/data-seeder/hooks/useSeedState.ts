import { useEffect, useMemo, useState } from "react"
import type { CalendarBreak } from "@/api/admin/program-calendar.api"
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

function buildInitialSectionConfigs(): Record<string, SectionConfig> {
  const out: Record<string, SectionConfig> = {}

  Object.entries(LEVEL_DEFS).forEach(([, names]) => {
    names.forEach((levelName) => {
      out[levelName] = SECTION_DEFAULTS.map((s) => ({ ...s }))
    })
  })

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

export function useSeedState() {
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  // ===== LEVEL CONFIGS (NOT AUTO-SELECTED) =====
  const [levelConfigs, setLevelConfigs] = useState<Record<string, ProgramLevelConfig>>(
    buildInitialLevelConfigs,
  )

  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>(
    buildInitialSectionConfigs,
  )

  // ===== COURSES & STRANDS (NOT AUTO-SELECTED) =====
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  const [selectedStrands, setSelectedStrands] = useState<Set<string>>(new Set())

  // ===== SUBJECTS (NOT AUTO-SELECTED) =====
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())

  const allSelectableSubjects = useMemo(() => {
    const out = new Set<string>()

    selectedPrograms.forEach((prog) => {
      if (LEVEL_DEFS[prog]) {
        // Fall back to LEVEL_DEFS[prog] when the user hasn't adjusted
        // level count yet — same fallback used in SeederCard and derivedSelectedLevels
        const levelNames = levelConfigs[prog]?.names ?? LEVEL_DEFS[prog]
        levelNames.forEach((lvl) => {
          LEVEL_SUBJECTS[lvl]?.forEach((s) => {
            out.add(subjectKey(lvl, s))
          })
        })
      }

      if (prog === "shs") {
        selectedStrands.forEach((strand) => {
          SHS_STRAND_SUBJECTS[strand]?.forEach((s) => {
            out.add(subjectKey(strand, s))
          })
        })
      }

      if (prog === "college") {
        selectedCourses.forEach((code) => {
          COURSE_SUBJECTS[code]?.forEach((s) => {
            out.add(subjectKey(code, s))
          })
        })
      }
    })

    return Array.from(out)
  }, [selectedPrograms, levelConfigs, selectedStrands, selectedCourses])

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
      const key = gradingScaleByProgram[prog]

      if (!key) return

      const preset = GRADING_SCALE_PRESETS.find((p) => p.key === key)

      if (preset) {
        out[prog] = preset
      }
    })

    return out
  }, [selectedPrograms, gradingScaleByProgram])

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
        GRADING_SCHEME_TEMPLATES.forEach((tpl) => {
          next[tpl.programType] = true
        })
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
        SEMESTER_TEMPLATES.forEach((tpl) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedProgramCalendars, programCalendarConfigs, seedSemesterTemplates])

  // ===== LEVEL & SECTION MANAGEMENT =====
  function resolveEntityLevelNames(entityKey: string, count: number): string[] {
    const course = COLLEGE_COURSES.find((c) => c.code === entityKey);
    if (course) return COLLEGE_YEAR_LABELS.slice(0, count);
    if (SHS_STRANDS.includes(entityKey)) return LEVEL_DEFS["shs"]?.slice(0, count) ?? [];
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
          next[oldName] ?? SECTION_DEFAULTS.map((s) => ({ ...s }))

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
    setLevelConfigs(buildInitialLevelConfigs())
    setSectionConfigs(buildInitialSectionConfigs())
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
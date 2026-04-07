// frontend/src/components/admin/organization/hooks/useSeedState.ts
import { useMemo, useState } from "react"
import {
  COLLEGE_COURSES,
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  SHS_STRANDS,
  GRADING_SCALE_PRESETS,
  SECTION_DEFAULTS,
  generateLevelNames,
  type GradingScalePreset,
} from "../constants/seed-data"

export interface ProgramLevelConfig {
  count: number
  names: string[]
}

export type SectionConfig = { name: string; capacity: number }[]

// Sensible default preset per program type
const DEFAULT_PRESET_PER_PROGRAM: Record<string, string> = {
  daycare: "deped_k12",
  kinder: "deped_k12",
  elementary: "deped_k12",
  jhs: "deped_k12",
  shs: "deped_k12",
  college: "college_5pt",
}

// Helper: build initial section configs
function buildInitialSectionConfigs(): Record<string, SectionConfig> {
  const out: Record<string, SectionConfig> = {}
  Object.entries(LEVEL_DEFS).forEach(([, names]) => {
    names.forEach((levelName) => {
      out[levelName] = SECTION_DEFAULTS.map((s) => ({ ...s }))
    })
  })
  return out
}

export function useSeedState() {
  // ── Programs ───────────────────────────────────────────────────────────────
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  // ── Custom level config per program ───────────────────────────────────────
  const [levelConfigs, setLevelConfigs] = useState<Record<string, ProgramLevelConfig>>(() => {
    const initial: Record<string, ProgramLevelConfig> = {}
    Object.entries(LEVEL_DEFS).forEach(([prog, names]) => {
      initial[prog] = { count: names.length, names: [...names] }
    })
    return initial
  })

  // ── Sections ──────────────────────────────────────────────────────────────
  const [sectionConfigs, setSectionConfigs] = useState<Record<string, SectionConfig>>(
    buildInitialSectionConfigs,
  )

  // ── Courses / Strands ──────────────────────────────────────────────────────
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(COLLEGE_COURSES.map((c) => c.code))
  )
  const [selectedStrands, setSelectedStrands] = useState<Set<string>>(
    new Set(SHS_STRANDS)
  )

  // ── Subjects ───────────────────────────────────────────────────────────────
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(() => {
    const all = new Set<string>()
    Object.values(LEVEL_SUBJECTS).flat().forEach((s) => all.add(s))
    Object.values(SHS_STRAND_SUBJECTS).flat().forEach((s) => all.add(s))
    Object.values(COURSE_SUBJECTS).flat().forEach((s) => all.add(s))
    return all
  })

  const allSelectableSubjects = useMemo(() => {
    const out = new Set<string>()
    selectedPrograms.forEach((prog) => {
      if (LEVEL_DEFS[prog]) {
        levelConfigs[prog]?.names.forEach((lvl) => {
          LEVEL_SUBJECTS[lvl]?.forEach((s) => out.add(s))
        })
      }
      if (prog === "shs") {
        selectedStrands.forEach((strand) => {
          SHS_STRAND_SUBJECTS[strand]?.forEach((s) => out.add(s))
        })
      }
      if (prog === "college") {
        selectedCourses.forEach((code) => {
          COURSE_SUBJECTS[code]?.forEach((s) => out.add(s))
        })
      }
    })
    return Array.from(out)
  }, [selectedPrograms, levelConfigs, selectedStrands, selectedCourses])

  // ── Grading Scale ─────────────────────────────────────────────────────────
  const [seedGradingScale, setSeedGradingScale] = useState(true)

  const [gradingScaleByProgram, setGradingScaleByProgram] = useState<Record<string, string>>(
    () => ({ ...DEFAULT_PRESET_PER_PROGRAM })
  )

  function setGradingScaleForProgram(prog: string, presetKey: string) {
    setGradingScaleByProgram((prev) => ({ ...prev, [prog]: presetKey }))
  }

  const resolvedGradingScales = useMemo((): Record<string, GradingScalePreset> => {
    const out: Record<string, GradingScalePreset> = {}
    Array.from(selectedPrograms).forEach((prog) => {
      const key = gradingScaleByProgram[prog] ?? GRADING_SCALE_PRESETS[0].key
      const preset = GRADING_SCALE_PRESETS.find((p) => p.key === key)
      if (preset) out[prog] = preset
    })
    return out
  }, [selectedPrograms, gradingScaleByProgram])

  // ── Level helpers ──────────────────────────────────────────────────────────
  function setLevelCount(prog: string, count: number) {
    setLevelConfigs((prev) => {
      const existing = prev[prog] ?? { count: 0, names: [] }
      const newNames = generateLevelNames(prog, count)
      const merged = newNames.map((defaultName, i) => {
        const oldName = existing.names[i]
        const defaultAtI = generateLevelNames(prog, existing.count)[i]
        return oldName && oldName !== defaultAtI ? oldName : defaultName
      })
      return { ...prev, [prog]: { count, names: merged } }
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
        const current = next[oldName] ?? SECTION_DEFAULTS.map((s) => ({ ...s }))
        delete next[oldName]
        next[newName] = current
        return next
      })

      return { ...prev, [prog]: { ...existing, names } }
    })
  }

  function renameLevelSections(levelName: string, sections: SectionConfig) {
    setSectionConfigs((prev) => ({ ...prev, [levelName]: sections }))
  }

  // ── Generic set helpers ───────────────────────────────────────────────────
  function toggleSet(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setter(next)
  }

  function selectAll(keys: string[], setter: (s: Set<string>) => void) {
    setter(new Set(keys))
  }

  function deselectAll(setter: (s: Set<string>) => void) {
    setter(new Set())
  }

  return {
    selectedPrograms, setSelectedPrograms,
    selectedCourses, setSelectedCourses,
    selectedStrands, setSelectedStrands,
    selectedSubjects, setSelectedSubjects,
    allSelectableSubjects,
    levelConfigs,
    setLevelCount,
    renameLevelAt,

    sectionConfigs,
    setSectionsForLevel: renameLevelSections,

    seedGradingScale, setSeedGradingScale,
    gradingScaleByProgram, setGradingScaleForProgram,
    resolvedGradingScales,

    toggleSet,
    selectAll,
    deselectAll,
  }
}
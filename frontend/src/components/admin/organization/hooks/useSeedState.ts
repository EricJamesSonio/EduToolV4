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
  generateLevelNames,
  type GradingScalePreset,
} from "../constants/seed-data"

// Custom level config per program: count + editable names
export interface ProgramLevelConfig {
  count: number
  names: string[]  // length === count, admin-editable
}

export function useSeedState() {
  // ── Programs ───────────────────────────────────────────────────────────────
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  // ── Custom level config per program (admin sets count + can rename) ────────
  const [levelConfigs, setLevelConfigs] = useState<Record<string, ProgramLevelConfig>>(() => {
    const initial: Record<string, ProgramLevelConfig> = {}
    Object.entries(LEVEL_DEFS).forEach(([prog, names]) => {
      initial[prog] = { count: names.length, names: [...names] }
    })
    return initial
  })

  // Derived: all level names currently active across selected programs
  const activeLevelNames = useMemo(() => {
    const out = new Set<string>()
    Array.from(selectedPrograms).forEach((prog) => {
      if (levelConfigs[prog]) {
        levelConfigs[prog].names.forEach((n) => out.add(n))
      }
    })
    return out
  }, [selectedPrograms, levelConfigs])

  // ── Courses / Strands ──────────────────────────────────────────────────────
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(COLLEGE_COURSES.map((c) => c.code))
  )
  const [selectedStrands, setSelectedStrands] = useState<Set<string>>(
    new Set(SHS_STRANDS)
  )

  // ── Subjects (derived from active levels, strands, courses) ───────────────
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
          // Fall back to the default subjects for the level name, or nothing
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

  // ── Grading Scale ──────────────────────────────────────────────────────────
  const [selectedGradingScaleKey, setSelectedGradingScaleKey] = useState<string | null>(
    GRADING_SCALE_PRESETS[0].key
  )
  const [seedGradingScale, setSeedGradingScale] = useState(true)

  const selectedGradingScalePreset: GradingScalePreset | null = useMemo(
    () => GRADING_SCALE_PRESETS.find((p) => p.key === selectedGradingScaleKey) ?? null,
    [selectedGradingScaleKey]
  )

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  // Update level count for a program — regenerates names keeping any custom edits
  function setLevelCount(prog: string, count: number) {
    setLevelConfigs((prev) => {
      const existing = prev[prog] ?? { count: 0, names: [] }
      const newNames = generateLevelNames(prog, count)
      // Preserve any custom renames the admin made up to the new count
      const merged = newNames.map((defaultName, i) => {
        const oldName = existing.names[i]
        // If old name differs from what would be auto-generated at index i, keep it
        const defaultAtI = generateLevelNames(prog, existing.count)[i]
        return oldName && oldName !== defaultAtI ? oldName : defaultName
      })
      return { ...prev, [prog]: { count, names: merged } }
    })
  }

  // Rename a specific level at index
  function renameLevelAt(prog: string, index: number, newName: string) {
    setLevelConfigs((prev) => {
      const existing = prev[prog]
      if (!existing) return prev
      const names = [...existing.names]
      names[index] = newName
      return { ...prev, [prog]: { ...existing, names } }
    })
  }

  return {
    selectedPrograms,  setSelectedPrograms,
    selectedCourses,   setSelectedCourses,
    selectedStrands,   setSelectedStrands,
    selectedSubjects,  setSelectedSubjects,
    allSelectableSubjects,
    levelConfigs,
    activeLevelNames,
    setLevelCount,
    renameLevelAt,
    seedGradingScale,  setSeedGradingScale,
    selectedGradingScaleKey, setSelectedGradingScaleKey,
    selectedGradingScalePreset,
    toggleSet,
    selectAll,
    deselectAll,
  }
}
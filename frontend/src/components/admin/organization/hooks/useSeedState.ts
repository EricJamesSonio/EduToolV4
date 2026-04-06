import { useMemo, useState } from "react"
import {
  COLLEGE_COURSES,
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  SHS_STRANDS,
} from "../constants/seed-data"

export function useSeedState() {
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set())

  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(COLLEGE_COURSES.map((c) => c.code))
  )

  const [selectedStrands, setSelectedStrands] = useState<Set<string>>(
    new Set(SHS_STRANDS)
  )

  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(() => {
    const all = new Set<string>()
    Object.values(LEVEL_DEFS).flat().forEach((l) => all.add(l))
    return all
  })

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
        LEVEL_DEFS[prog].forEach((lvl) => {
          if (selectedLevels.has(lvl)) {
            LEVEL_SUBJECTS[lvl]?.forEach((s) => out.add(s))
          }
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
  }, [selectedPrograms, selectedLevels, selectedStrands, selectedCourses])

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
    selectedPrograms,  setSelectedPrograms,
    selectedCourses,   setSelectedCourses,
    selectedStrands,   setSelectedStrands,
    selectedLevels,    setSelectedLevels,
    selectedSubjects,  setSelectedSubjects,
    allSelectableSubjects,
    toggleSet,
    selectAll,
    deselectAll,
  }
}
import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"

/**
 * Ticks subjects automatically as they become selectable (a department,
 * course, strand or level was picked), mirroring how levels and sections
 * already behave. Subjects the admin later unticks stay unticked, because
 * only keys that were not seen before are added.
 */
export function useAutoSelectSubjects(
  allSelectableSubjects: string[],
  setSelectedSubjects: Dispatch<SetStateAction<Set<string>>>,
): void {
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const seen = seenRef.current
    const added = allSelectableSubjects.filter((key) => !seen.has(key))
    seenRef.current = new Set(allSelectableSubjects)
    if (added.length === 0) return

    setSelectedSubjects((prev) => {
      const next = new Set(prev)
      for (const key of added) next.add(key)
      return next
    })
  }, [allSelectableSubjects, setSelectedSubjects])
}
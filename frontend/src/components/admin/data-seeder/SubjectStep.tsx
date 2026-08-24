"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import {
  COURSE_SUBJECTS, COURSE_SUBJECT_YEARS, LEVEL_DEFS, LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS, SHS_MAJOR_YEARS, COLLEGE_GE_SET, SHS_MINOR_SET,
  COLLEGE_GE_LEVEL, SHS_MINOR_LEVEL, UNASSIGNED_YEAR, subjectKey, parseSubjectKey,
} from "./constants/seed-data"

interface SubjectStepProps {
  selectedPrograms:      Set<string>
  selectedLevels:        Set<string>
  selectedStrands:       Set<string>
  selectedCourses:       Set<string>
  selectedSubjects:      Set<string>
  disabledSubjectTitles: Set<string>
  onToggleSubject:       (key: string) => void
  onSelectAllForGroup:   (keys: string[]) => void
  onDeselectAllForGroup: (keys: string[]) => void
  allSelectableSubjects: string[]
  levelSubjectsOverride?:  Record<string, string[]>
  courseSubjectsOverride?: Record<string, string[]>
  strandSubjectsOverride?: Record<string, string[]>
  levelDefsOverride?: Record<string, string[]>
}

function SubjectTypeTag({ type }: { type: "major" | "minor" }) {
  return (
    <Badge variant={type === "minor" ? "outline" : "secondary"} className="text-[10px] px-1.5 py-0 font-normal shrink-0">
      {type}
    </Badge>
  )
}

function yearRank(year: string): number {
  const m = year.match(/\d+/)
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER
}

export function SubjectStep({
  selectedPrograms, selectedLevels, selectedStrands, selectedCourses, selectedSubjects,
  disabledSubjectTitles, onToggleSubject, onSelectAllForGroup, onDeselectAllForGroup,
  allSelectableSubjects, levelSubjectsOverride, courseSubjectsOverride, strandSubjectsOverride,
  levelDefsOverride,
}: SubjectStepProps) {
  if (allSelectableSubjects.length === 0) return null

  function isDisabled(key: string): boolean {
    const { subjectName } = parseSubjectKey(key)
    return disabledSubjectTitles.has(subjectName)
  }

  function renderSubjectCollapsible(
    collapsibleKey: string, title: string, groupName: string, plainSubjects: string[],
    minorSet?: Set<string>, yearFor?: (subjectName: string) => string | undefined,
  ) {
    const uniqueSubjects = [...new Set(plainSubjects)]
    const groupKeys = uniqueSubjects.map((s) => subjectKey(groupName, s))
    const availableKeys = [...new Set(groupKeys.filter((k) => allSelectableSubjects.includes(k)))]
    if (availableKeys.length === 0) return null

    const selCount = availableKeys.filter((k) => selectedSubjects.has(k) && !isDisabled(k)).length

    function renderGrid(keys: string[]) {
      return (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {keys.map((key) => {
            const { subjectName } = parseSubjectKey(key)
            const isMinor = minorSet?.has(subjectName) ?? false
            return (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedSubjects.has(key)}
                  onChange={() => !isDisabled(key) && onToggleSubject(key)}
                  label={subjectName}
                  subtle
                  disabled={isDisabled(key)}
                />
                <SubjectTypeTag type={isMinor ? "minor" : "major"} />
                {isMinor && (COLLEGE_GE_LEVEL[subjectName] ?? SHS_MINOR_LEVEL[subjectName]) && (
                  <span className="text-[10px] text-muted-foreground shrink-0 not-interactive">
                    {COLLEGE_GE_LEVEL[subjectName] ?? SHS_MINOR_LEVEL[subjectName]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    let rows: React.ReactNode = renderGrid(availableKeys)

    if (yearFor) {
      const buckets = new Map<string, string[]>()
      for (const key of availableKeys) {
        const { subjectName } = parseSubjectKey(key)
        const year = yearFor(subjectName) ?? UNASSIGNED_YEAR
        const arr = buckets.get(year) ?? []
        arr.push(key)
        buckets.set(year, arr)
      }
      if (buckets.size > 1) {
        const years = Array.from(buckets.keys()).sort((a, b) => yearRank(a) - yearRank(b) || a.localeCompare(b))
        rows = (
          <div className="space-y-3">
            {years.map((year) => {
              const keys = buckets.get(year)!
              const yearSel = keys.filter((k) => selectedSubjects.has(k) && !isDisabled(k)).length
              return (
                <Collapsible key={year} title={year} count={yearSel} total={keys.length}>
                  <div className="space-y-2">
                    <div className="flex gap-3 mb-2">
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => onSelectAllForGroup(keys)}>All</button>
                      <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => onDeselectAllForGroup(keys)}>None</button>
                    </div>
                    {renderGrid(keys)}
                  </div>
                </Collapsible>
              )
            })}
          </div>
        )
      }
    }

    return (
      <Collapsible key={collapsibleKey} title={title} count={selCount} total={availableKeys.length}>
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => onSelectAllForGroup(availableKeys)}>All</button>
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => onDeselectAllForGroup(availableKeys)}>None</button>
          </div>
          {rows}
        </div>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 not-interactive">
        <span className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">major</Badge>
          = unique per level/course
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">minor</Badge>
          = shared across all
        </span>
      </div>

      {Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p] || !!levelDefsOverride?.[p])
        .flatMap((prog) => {
          const effLevels = levelDefsOverride?.[prog] ?? LEVEL_DEFS[prog] ?? []
          return effLevels
            .filter((lvl) => selectedLevels.has(lvl))
            .map((lvl) =>
              renderSubjectCollapsible(lvl, lvl, lvl, levelSubjectsOverride?.[lvl] ?? LEVEL_SUBJECTS[lvl] ?? []),
            )
        })}

      {selectedPrograms.has("shs") &&
        Array.from(selectedStrands).map((strand) =>
          renderSubjectCollapsible(
            strand,
            `SHS – ${strand}`,
            strand,
            strandSubjectsOverride?.[strand] ?? SHS_STRAND_SUBJECTS[strand] ?? [],
            SHS_MINOR_SET,
            (name) => SHS_MINOR_LEVEL[name] ?? SHS_MAJOR_YEARS[strand]?.[name],
          ),
        )}

      {selectedPrograms.has("college") &&
        Array.from(selectedCourses).map((code) =>
          renderSubjectCollapsible(
            code,
            `${code} Subjects`,
            code,
            courseSubjectsOverride?.[code] ?? COURSE_SUBJECTS[code] ?? [],
            COLLEGE_GE_SET,
            (name) => COLLEGE_GE_LEVEL[name] ?? COURSE_SUBJECT_YEARS[code]?.[name],
          ),
        )}
    </div>
  )
}
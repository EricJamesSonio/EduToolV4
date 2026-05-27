"use client"

import { Badge }    from "@/components/ui/badge"
import { Checkbox }    from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import {
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  COLLEGE_GE_SET,
  SHS_MINOR_SET,
  COLLEGE_GE_LEVEL,
  SHS_MINOR_LEVEL,
  subjectKey,
  parseSubjectKey,
} from "./constants/seed-data"

interface SubjectStepProps {
  selectedPrograms:      Set<string>
  selectedLevels:        Set<string>
  selectedStrands:       Set<string>
  selectedCourses:       Set<string>
  selectedSubjects:      Set<string>        // compound keys: "Grade 1::Filipino"
  disabledSubjectTitles: Set<string>        // plain names from existing subjects
  onToggleSubject:       (key: string) => void
  onSelectAllForGroup:   (keys: string[]) => void
  onDeselectAllForGroup: (keys: string[]) => void
  allSelectableSubjects: string[]           // compound keys
}

function SubjectTypeTag({ type }: { type: "major" | "minor" }) {
  return (
    <Badge
      variant={type === "minor" ? "outline" : "secondary"}
      className="text-[10px] px-1.5 py-0 font-normal shrink-0"
    >
      {type}
    </Badge>
  )
}

export function SubjectStep({
  selectedPrograms,
  selectedLevels,
  selectedStrands,
  selectedCourses,
  selectedSubjects,
  disabledSubjectTitles,
  onToggleSubject,
  onSelectAllForGroup,
  onDeselectAllForGroup,
  allSelectableSubjects,
}: SubjectStepProps) {
  if (allSelectableSubjects.length === 0) return null

  // disabledSubjectTitles uses plain names — check against parsed subject name
  function isDisabled(key: string): boolean {
    const { subjectName } = parseSubjectKey(key)
    return disabledSubjectTitles.has(subjectName)
  }

  function renderSubjectCollapsible(
    collapsibleKey: string,
    title:          string,
    groupName:      string,          // level name, strand name, or course code
    plainSubjects:  string[],        // plain subject names from LEVEL_SUBJECTS etc.
    minorSet?:      Set<string>,
  ) {
    // Build compound keys for this group
    const groupKeys = plainSubjects.map((s) => subjectKey(groupName, s))

    // Only show keys that are in the selectable set
    const availableKeys = groupKeys.filter((k) => allSelectableSubjects.includes(k))
    if (availableKeys.length === 0) return null

    const selCount = availableKeys.filter(
      (k) => selectedSubjects.has(k) && !isDisabled(k),
    ).length

    return (
      <Collapsible
        key={collapsibleKey}
        title={title}
        count={selCount}
        total={availableKeys.length}
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onSelectAllForGroup(availableKeys)}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => onDeselectAllForGroup(availableKeys)}
            >
              None
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {availableKeys.map((key) => {
              const { subjectName } = parseSubjectKey(key)
              const isMinor         = minorSet?.has(subjectName) ?? false
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
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {COLLEGE_GE_LEVEL[subjectName] ?? SHS_MINOR_LEVEL[subjectName]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
            major
          </Badge>
          = unique per level/course
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
            minor
          </Badge>
          = shared across all
        </span>
      </div>

      {/* Level subjects — each level is its own group */}
      {Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((prog) =>
          LEVEL_DEFS[prog]
            .filter((lvl) => selectedLevels.has(lvl))
            .map((lvl) =>
              renderSubjectCollapsible(
                lvl,
                lvl,
                lvl,
                LEVEL_SUBJECTS[lvl] ?? [],
              ),
            ),
        )}

      {/* SHS strand subjects */}
      {selectedPrograms.has("shs") &&
        Array.from(selectedStrands).map((strand) =>
          renderSubjectCollapsible(
            strand,
            `SHS – ${strand}`,
            strand,
            SHS_STRAND_SUBJECTS[strand] ?? [],
            SHS_MINOR_SET,
          ),
        )}

      {/* College course subjects */}
      {selectedPrograms.has("college") &&
        Array.from(selectedCourses).map((code) =>
          renderSubjectCollapsible(
            code,
            `${code} Subjects`,
            code,
            COURSE_SUBJECTS[code] ?? [],
            COLLEGE_GE_SET,
          ),
        )}
    </div>
  )
}

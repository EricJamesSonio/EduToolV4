"use client"

import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import {
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
  COLLEGE_GE_SET,
  SHS_MINOR_SET,
} from "./constants/seed-data"

interface SubjectStepProps {
  selectedPrograms: Set<string>
  selectedLevels: Set<string>
  selectedStrands: Set<string>
  selectedCourses: Set<string>
  selectedSubjects: Set<string>
  onToggleSubject: (subj: string) => void
  onSelectAllForGroup: (subjects: string[]) => void
  onDeselectAllForGroup: (subjects: string[]) => void
  allSelectableSubjects: string[]
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
  onToggleSubject,
  onSelectAllForGroup,
  onDeselectAllForGroup,
  allSelectableSubjects,
}: SubjectStepProps) {
  if (allSelectableSubjects.length === 0) return null

  function renderSubjectCollapsible(
    key: string,
    title: string,
    subjects: string[],
    minorSet?: Set<string>,
  ) {
    const availableSubjects = subjects.filter((s) =>
      allSelectableSubjects.includes(s),
    )

    if (availableSubjects.length === 0) return null

    const selCount = availableSubjects.filter((s) =>
      selectedSubjects.has(s),
    ).length

    return (
      <Collapsible
        key={key}
        title={title}
        count={selCount}
        total={availableSubjects.length}
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onSelectAllForGroup(availableSubjects)}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => onDeselectAllForGroup(availableSubjects)}
            >
              None
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {availableSubjects.map((subj) => {
              const isMinor = minorSet?.has(subj) ?? false
              return (
                <div key={subj} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedSubjects.has(subj)}
                    onChange={() => onToggleSubject(subj)}
                    label={subj}
                    subtle
                  />
                  <SubjectTypeTag type={isMinor ? "minor" : "major"} />
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
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Subjects
        </Label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
      </div>

      {/* Level subjects — K-12 has no minors */}
      {Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((prog) =>
          LEVEL_DEFS[prog]
            .filter((lvl) => selectedLevels.has(lvl))
            .map((lvl) =>
              renderSubjectCollapsible(
                lvl,
                lvl,
                LEVEL_SUBJECTS[lvl] ?? [],
              ),
            ),
        )}

      {/* SHS strand subjects — first 10 are minors */}
      {selectedPrograms.has("shs") &&
        Array.from(selectedStrands).map((strand) =>
          renderSubjectCollapsible(
            strand,
            `SHS – ${strand}`,
            SHS_STRAND_SUBJECTS[strand] ?? [],
            SHS_MINOR_SET,
          ),
        )}

      {/* College course subjects — first 10 (GE) are minors */}
      {selectedPrograms.has("college") &&
        Array.from(selectedCourses).map((code) =>
          renderSubjectCollapsible(
            code,
            `${code} Subjects`,
            COURSE_SUBJECTS[code] ?? [],
            COLLEGE_GE_SET,
          ),
        )}
    </div>
  )
}
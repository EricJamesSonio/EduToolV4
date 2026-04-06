import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import {
  COURSE_SUBJECTS,
  LEVEL_DEFS,
  LEVEL_SUBJECTS,
  SHS_STRAND_SUBJECTS,
} from "./constants/seed-data"

interface SubjectStepProps {
  selectedPrograms: Set<string>
  selectedLevels:   Set<string>
  selectedStrands:  Set<string>
  selectedCourses:  Set<string>
  selectedSubjects: Set<string>
  onToggleSubject:         (subj: string) => void
  onSelectAllForGroup:     (subjects: string[]) => void
  onDeselectAllForGroup:   (subjects: string[]) => void
  allSelectableSubjects:   string[]
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

  function renderSubjectCollapsible(key: string, title: string, subjects: string[]) {
    const selCount = subjects.filter((s) => selectedSubjects.has(s)).length
    return (
      <Collapsible key={key} title={title} count={selCount} total={subjects.length}>
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onSelectAllForGroup(subjects)}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={() => onDeselectAllForGroup(subjects)}
            >
              None
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {subjects.map((subj) => (
              <Checkbox
                key={subj}
                checked={selectedSubjects.has(subj)}
                onChange={() => onToggleSubject(subj)}
                label={subj}
                subtle
              />
            ))}
          </div>
        </div>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Subjects
      </Label>

      {/* Level subjects */}
      {Array.from(selectedPrograms)
        .filter((p) => LEVEL_DEFS[p])
        .flatMap((prog) =>
          LEVEL_DEFS[prog]
            .filter((lvl) => selectedLevels.has(lvl))
            .map((lvl) =>
              renderSubjectCollapsible(lvl, lvl, LEVEL_SUBJECTS[lvl] ?? [])
            )
        )}

      {/* SHS strand subjects */}
      {selectedPrograms.has("shs") &&
        Array.from(selectedStrands).map((strand) =>
          renderSubjectCollapsible(
            strand,
            `SHS – ${strand}`,
            SHS_STRAND_SUBJECTS[strand] ?? []
          )
        )}

      {/* College course subjects */}
      {selectedPrograms.has("college") &&
        Array.from(selectedCourses).map((code) =>
          renderSubjectCollapsible(
            code,
            `${code} Subjects`,
            COURSE_SUBJECTS[code] ?? []
          )
        )}
    </div>
  )
}
import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import { LEVEL_DEFS, PROGRAMS } from "./constants/seed-data"

interface LevelStepProps {
  selectedPrograms: Set<string>
  selectedLevels:   Set<string>
  onToggleLevel:    (lvl: string) => void
  onSelectAllForProgram:   (levels: string[]) => void
  onDeselectAllForProgram: (levels: string[]) => void
}

export function LevelStep({
  selectedPrograms,
  selectedLevels,
  onToggleLevel,
  onSelectAllForProgram,
  onDeselectAllForProgram,
}: LevelStepProps) {
  const programsWithLevels = Array.from(selectedPrograms).filter((p) => LEVEL_DEFS[p])

  if (programsWithLevels.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Levels
      </Label>
      <div className="space-y-2">
        {programsWithLevels.map((prog) => {
          const levels   = LEVEL_DEFS[prog]
          const selected = levels.filter((l) => selectedLevels.has(l))
          return (
            <Collapsible
              key={prog}
              title={PROGRAMS.find((p) => p.key === prog)?.label ?? prog}
              count={selected.length}
              total={levels.length}
              defaultOpen
            >
              <div className="space-y-2">
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => onSelectAllForProgram(levels)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => onDeselectAllForProgram(levels)}
                  >
                    None
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {levels.map((lvl) => (
                    <Checkbox
                      key={lvl}
                      checked={selectedLevels.has(lvl)}
                      onChange={() => onToggleLevel(lvl)}
                      label={lvl}
                    />
                  ))}
                </div>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
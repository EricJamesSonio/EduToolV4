import { Check, Layers } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ProgramStepProps {
  selectedPrograms: Set<string>
  disabledProgramTypes: Set<string>
  onToggleProgram: (key: string) => void
  onSelectAllPrograms: () => void
  onDeselectAllPrograms: () => void
}

interface ProgramDef {
  key: string
  label: string
  type: string
}

const PROGRAM_DEFS: ProgramDef[] = [
  { key: "daycare", label: "Daycare", type: "daycare" },
  { key: "kinder", label: "Kindergarten", type: "kinder" },
  { key: "elementary", label: "Elementary", type: "elementary" },
  { key: "jhs", label: "Junior High School", type: "jhs" },
  { key: "shs", label: "Senior High School", type: "shs" },
  { key: "college", label: "College", type: "college" },
]

export function ProgramStep({
  selectedPrograms,
  disabledProgramTypes,
  onToggleProgram,
  onSelectAllPrograms,
  onDeselectAllPrograms,
}: ProgramStepProps) {
  const isDisabled = (type: string) => disabledProgramTypes.has(type)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Programs
        </Label>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={onSelectAllPrograms}
          >
            All
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={onDeselectAllPrograms}
          >
            None
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PROGRAM_DEFS.map((prog) => (
          <button
            key={prog.key}
            type="button"
            onClick={() => !isDisabled(prog.type) && onToggleProgram(prog.key)}
            disabled={isDisabled(prog.type)}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors text-sm",
              isDisabled(prog.type)
                ? "opacity-50 cursor-not-allowed bg-muted/30 border-muted-foreground/20"
                : "hover:bg-muted/50",
              selectedPrograms.has(prog.key) && "border-primary bg-primary/5",
            )}
          >
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                selectedPrograms.has(prog.key)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {selectedPrograms.has(prog.key) && (
                <Check className="h-3 w-3" />
              )}
            </div>
            <span>{prog.label}</span>
            {isDisabled(prog.type) && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
import { Check, Layers } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { PROGRAMS } from "./constants/seed-data"

interface ProgramStepProps {
  selectedPrograms:    Set<string>
  onToggleProgram:     (key: string) => void
  onSelectAllPrograms: () => void
  onDeselectAllPrograms: () => void
}

export function ProgramStep({
  selectedPrograms,
  onToggleProgram,
  onSelectAllPrograms,
  onDeselectAllPrograms,
}: ProgramStepProps) {
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
        {PROGRAMS.map((prog) => (
          <button
            key={prog.key}
            type="button"
            onClick={() => onToggleProgram(prog.key)}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 text-sm",
              selectedPrograms.has(prog.key) && "border-primary bg-primary/5"
            )}
          >
            <div className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
              selectedPrograms.has(prog.key)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/40"
            )}>
              {selectedPrograms.has(prog.key) && <Check className="h-3 w-3" />}
            </div>
            {prog.label}
          </button>
        ))}
      </div>
    </div>
  )
}
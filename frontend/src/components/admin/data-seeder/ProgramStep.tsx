import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgramStepProps {
  selectedPrograms: Set<string>
  disabledProgramTypes: Set<string>
  topUpProgramTypes?: Set<string>
  onToggleProgram: (key: string) => void
  onSelectAllPrograms: () => void
  onDeselectAllPrograms: () => void
  allowedProgramTypes?: Set<string> | null
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
  topUpProgramTypes,
  onToggleProgram,
  onSelectAllPrograms,
  onDeselectAllPrograms,
  allowedProgramTypes,
}: ProgramStepProps) {
  const isDisabled = (type: string) => disabledProgramTypes.has(type)
  const isTopUp = (type: string) => !!topUpProgramTypes?.has(type)
  const visiblePrograms =
    allowedProgramTypes && allowedProgramTypes.size > 0
      ? PROGRAM_DEFS.filter((p) => allowedProgramTypes.has(p.key))
      : PROGRAM_DEFS
  const hasTopUp = visiblePrograms.some((p) => isTopUp(p.type))

  return (
    <div className="space-y-2">
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visiblePrograms.map((prog) => {
          const disabled = isDisabled(prog.type)
          const topUp = isTopUp(prog.type)
          return (
            <button
              key={prog.key}
              type="button"
              onClick={() => !disabled && onToggleProgram(prog.key)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors text-sm",
                disabled
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
                {selectedPrograms.has(prog.key) && <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate">{prog.label}</span>
                {topUp && (
                  <span className="block text-[11px] text-warning not-interactive">
                    Seeded · subjects missing
                  </span>
                )}
              </div>
              {disabled && (
                <span className="ml-auto text-xs text-muted-foreground not-interactive">
                  Seeded ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
      {hasTopUp && (
        <p className="text-xs text-muted-foreground not-interactive">
          Departments marked "subjects missing" were seeded without their subjects. Select them and
          pick their subjects below to add only what is missing. Nothing already seeded is duplicated.
        </p>
      )}
    </div>
  )
}
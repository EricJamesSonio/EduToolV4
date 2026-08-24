import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"
import { SHS_STRANDS } from "./constants/seed-data"

interface StrandStepProps {
  selectedStrands: Set<string>
  disabledStrandNames: Set<string>
  onToggleStrand: (strand: string) => void
  onSelectAllStrands: () => void
  onDeselectAllStrands: () => void
  strandsOverride?: string[] | null
}

export function StrandStep({
  selectedStrands,
  disabledStrandNames,
  onToggleStrand,
  onSelectAllStrands,
  onDeselectAllStrands,
  strandsOverride,
}: StrandStepProps) {
  const strands = strandsOverride ?? SHS_STRANDS
  const isDisabled = (name: string) => disabledStrandNames.has(name)

  return (
    <div className="space-y-2">
      <Collapsible
        title="Senior High School Strands"
        count={strands.filter((s) => selectedStrands.has(s) && !isDisabled(s)).length}
        total={strands.length}
        defaultOpen
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button type="button" className="text-xs text-primary hover:underline" onClick={onSelectAllStrands}>
              All
            </button>
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={onDeselectAllStrands}>
              None
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {strands.map((strand) => (
              <Checkbox
                key={strand}
                checked={selectedStrands.has(strand)}
                onChange={() => !isDisabled(strand) && onToggleStrand(strand)}
                label={strand}
                disabled={isDisabled(strand)}
              />
            ))}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
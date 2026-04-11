import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"

interface StrandStepProps {
  selectedStrands: Set<string>
  disabledStrandNames: Set<string>
  onToggleStrand: (strand: string) => void
  onSelectAllStrands: () => void
  onDeselectAllStrands: () => void
}

import { SHS_STRANDS } from "./constants/seed-data"

export function StrandStep({
  selectedStrands,
  disabledStrandNames,
  onToggleStrand,
  onSelectAllStrands,
  onDeselectAllStrands,
}: StrandStepProps) {
  const isDisabled = (name: string) => disabledStrandNames.has(name)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        SHS Strands
      </Label>
      <Collapsible
        title="Senior High School Strands"
        count={SHS_STRANDS.filter((s) => selectedStrands.has(s) && !isDisabled(s))
          .length}
        total={SHS_STRANDS.length}
        defaultOpen
      >
        <div className="space-y-2">
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={onSelectAllStrands}
            >
              All
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline"
              onClick={onDeselectAllStrands}
            >
              None
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {SHS_STRANDS.map((strand) => (
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
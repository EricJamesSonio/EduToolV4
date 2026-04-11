import { BookOpen } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "./ui/Checkbox"
import { Collapsible } from "./ui/Collapsible"

interface StrandStepProps {
  selectedStrands: Set<string>
  availableStrands: string[]
  onToggleStrand: (strand: string) => void
  onSelectAllStrands: () => void
  onDeselectAllStrands: () => void
}

export function StrandStep({
  selectedStrands,
  availableStrands,
  onToggleStrand,
  onSelectAllStrands,
  onDeselectAllStrands,
}: StrandStepProps) {
  if (availableStrands.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        SHS Strands
      </Label>
      <Collapsible
        title="Senior High School Strands"
        count={availableStrands.filter((s) => selectedStrands.has(s)).length}
        total={availableStrands.length}
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
            {availableStrands.map((strand) => (
              <Checkbox
                key={strand}
                checked={selectedStrands.has(strand)}
                onChange={() => onToggleStrand(strand)}
                label={strand}
              />
            ))}
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
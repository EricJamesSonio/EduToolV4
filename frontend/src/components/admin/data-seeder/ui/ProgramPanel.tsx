import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { PROGRAMS } from "../constants/seed-data"

interface ProgramPanelProps {
  program:      string
  badge?:       React.ReactNode
  defaultOpen?: boolean
  children:     React.ReactNode
}

export function ProgramPanel({
  program,
  badge,
  defaultOpen = true,
  children,
}: ProgramPanelProps) {
  const [open, setOpen] = useState(defaultOpen)
  const label = PROGRAMS.find((p) => p.key === program)?.label ?? program

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {badge}
          {open
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>
      {open && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  )
}

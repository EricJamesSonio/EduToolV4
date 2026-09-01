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
    <div className="overflow-hidden rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 sm:px-4"
      >
        <span className="min-w-0 flex-1 text-sm font-medium leading-tight break-words">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex min-w-0 items-center justify-end">{badge}</div>
          {open
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>
      {open && <div className="space-y-3 px-3 py-3 sm:px-4">{children}</div>}
    </div>
  )
}

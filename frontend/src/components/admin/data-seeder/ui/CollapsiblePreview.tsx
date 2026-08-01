import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

interface CollapsiblePreviewProps {
  label:    string
  count:    number
  children: React.ReactNode
}

export function CollapsiblePreview({ label, count, children }: CollapsiblePreviewProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-muted-foreground"
      >
        <span>
          {label} ({count})
        </span>
        {open
          ? <ChevronDown  className="h-3.5 w-3.5" />
          : <ChevronRight className="h-3.5 w-3.5" />
        }
      </button>
      {open && <div className="divide-y">{children}</div>}
    </div>
  )
}

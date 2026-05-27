import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CollapsibleProps {
  title:        string
  count:        number
  total:        number
  children:     React.ReactNode
  defaultOpen?: boolean
}

export function Collapsible({
  title,
  count,
  total,
  children,
  defaultOpen = false,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {count}/{total} selected
          </Badge>
          {open
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  )
}

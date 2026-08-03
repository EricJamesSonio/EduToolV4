import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectableCardProps {
  selected:  boolean
  onSelect:  () => void
  title:     string
  subtitle?: string
  className?: string
}

export function SelectableCard({
  selected,
  onSelect,
  title,
  subtitle,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
        selected && "border-primary bg-primary/5",
        className
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40"
        )}
      >
        {selected && <Check className="h-2.5 w-2.5" />}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </button>
  )
}

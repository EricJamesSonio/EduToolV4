import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectableCardProps {
  selected:        boolean
  onSelect:        () => void
  title:           string
  subtitle?:       string
  disabled?:       boolean
  disabledReason?: string
  className?:      string
}

export function SelectableCard({
  selected,
  onSelect,
  title,
  subtitle,
  disabled = false,
  disabledReason,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onSelect()
      }}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40 pointer-events-none select-none"
          : "hover:bg-muted/50",
        selected && !disabled && "border-primary bg-primary/5",
        className
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected && !disabled
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40"
        )}
      >
        {selected && !disabled && <Check className="h-2.5 w-2.5" />}
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{title}</p>
        {!disabled && subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {disabled && disabledReason && (
          <p className="text-xs text-muted-foreground mt-0.5">{disabledReason}</p>
        )}
      </div>
    </button>
  )
}
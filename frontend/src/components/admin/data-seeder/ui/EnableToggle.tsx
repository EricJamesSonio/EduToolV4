import { cn } from "@/lib/utils"

interface EnableToggleProps {
  enabled:   boolean
  onToggle:  (v: boolean) => void
  disabled?: boolean
}

export function EnableToggle({ enabled, onToggle, disabled = false }: EnableToggleProps) {
  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        aria-pressed={enabled}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          onToggle(!enabled)
        }}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-4" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked:   boolean
  onChange:  (v: boolean) => void
  label:     string
  subtle?:   boolean
  disabled?: boolean  // add this
}

export function Checkbox({ checked, onChange, label, subtle, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}  // guard here
      disabled={disabled}
      className="flex items-center gap-2 text-left group disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked && !disabled
          ? "border-primary bg-primary text-primary-foreground"
          : disabled
            ? "border-muted-foreground/20 bg-muted/30"
            : "border-muted-foreground/40 group-hover:border-primary/60"
      )}>
        {checked && !disabled && <Check className="h-3 w-3" />}
      </div>
      <span className={cn("text-sm", subtle ? "text-muted-foreground" : "font-medium")}>
        {label}
      </span>
    </button>
  )
}
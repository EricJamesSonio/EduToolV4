import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  checked:  boolean
  onChange: (v: boolean) => void
  label:    string
  subtle?:  boolean
}

export function Checkbox({ checked, onChange, label, subtle }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left group"
    >
      <div className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 group-hover:border-primary/60"
      )}>
        {checked && <Check className="h-3 w-3" />}
      </div>
      <span className={cn("text-sm", subtle ? "text-muted-foreground" : "font-medium")}>
        {label}
      </span>
    </button>
  )
}
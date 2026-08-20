"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_VALUES, type ProgramType } from "@/types/admin/program.types"

interface DepartmentStepProps {
  selectedTypes: Set<ProgramType>
  onToggle: (type: ProgramType) => void
  disabled?: boolean
}

const SELECTABLE_TYPES = PROGRAM_TYPE_VALUES.filter((t) => t !== "custom")

export function DepartmentStep({ selectedTypes, onToggle, disabled = false }: DepartmentStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground not-interactive">
        Select the departments your school actually has. This becomes your school&apos;s
        profile — only selected departments appear here to configure further.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SELECTABLE_TYPES.map((type) => {
          const selected = selectedTypes.has(type)
          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onToggle(type)}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                disabled && "cursor-not-allowed opacity-50",
                !disabled && "hover:bg-muted/50",
                selected && "border-primary bg-primary/5",
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {selected && <Check className="h-2.5 w-2.5" />}
              </div>
              <span className="font-medium">{PROGRAM_TYPE_LABELS[type]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
"use client"

import { cn } from "@/lib/utils"
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types"
import type { DraftDepartment } from "@/hooks/admin/useSchoolProfileDraft"

interface DepartmentTabsProps {
  departments: DraftDepartment[]
  activeType: string | null
  onSelect: (type: string) => void
}

function countFor(dept: DraftDepartment): string {
  const groups = dept.type === "college" ? dept.courses.length : dept.type === "shs" ? dept.strands.length : 0
  const levels =
    dept.type === "college"
      ? dept.courses.reduce((n, c) => n + c.levels.length, 0)
      : dept.type === "shs"
        ? dept.strands.reduce((n, s) => n + s.levels.length, 0)
        : dept.levels.length
  if (dept.type === "college" || dept.type === "shs") return `${groups} · ${levels} lvls`
  return `${levels} lvls`
}

export function DepartmentTabs({ departments, activeType, onSelect }: DepartmentTabsProps) {
  if (departments.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Selected departments">
      {departments.map((dept) => {
        const selected = dept.type === activeType
        return (
          <button
            key={dept.type}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(dept.type)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "bg-background hover:bg-muted/50 border-muted-foreground/20",
            )}
          >
            {PROGRAM_TYPE_LABELS[dept.type]}
            <span className={cn("ml-1.5 text-[10px] font-normal", selected ? "opacity-80" : "opacity-60")}>
              {countFor(dept)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

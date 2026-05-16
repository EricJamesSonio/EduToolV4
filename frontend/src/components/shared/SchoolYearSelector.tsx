"use client"

import { useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import type { SchoolYear } from "@/types/admin/school-year.types"
import { ui } from "@/styles/ui"

interface SchoolYearSelectorProps {
  schoolYears: SchoolYear[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SchoolYearSelector({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
}: SchoolYearSelectorProps): React.JSX.Element {
  useEffect(() => {
    if (!selectedId && schoolYears.length > 0) {
      const defaultId =
        schoolYears.find((sy) => sy.status === "active")?.id ??
        schoolYears[0].id

      onSelect(defaultId)
    }
  }, [schoolYears, selectedId, onSelect])

  if (isLoading) return <Skeleton className="h-11 w-64" />

  if (schoolYears.length === 0) {
    return <p className={ui.helperText}>No school years found.</p>
  }

  const selected = schoolYears.find((sy) => sy.id === selectedId)

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-5 w-5 text-black shrink-0" />

      <Select
        value={selectedId ?? ""}
        onValueChange={(value) => value && onSelect(value)}
      >
        <SelectTrigger className={ui.selectTrigger}>
          <span className="truncate">
            {selected?.name ?? "Select school year"}
          </span>
        </SelectTrigger>

        <SelectContent className="w-[16rem] min-w-[16rem]">
          {schoolYears.map((sy) => (
            <SelectItem
              key={sy.id}
              value={sy.id}
              className="text-base py-3 text-black"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium">{sy.name}</span>

                {sy.status === "active" && (
                  <Badge className="ml-auto bg-black text-white text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
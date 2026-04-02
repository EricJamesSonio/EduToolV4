// filepath: app/admin/sections/_components/SectionLevelFilter.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

interface SectionLevelFilterProps {
  filterLevelId: string;
  onFilterChange: (id: string) => void;
  grouped: { programName: string; levels: EnrichedLevel[] }[];
  levelMap: Record<string, { name: string; programName: string }>;
}

export function SectionLevelFilter({
  filterLevelId,
  onFilterChange,
  grouped,
  levelMap,
}: SectionLevelFilterProps): React.JSX.Element {
  const activeInfo = levelMap[filterLevelId];

  return (
    <div className="flex items-center gap-3">
      <Select value={filterLevelId} onValueChange={(v) => onFilterChange(v ?? "all")}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="All Levels">
            {filterLevelId === "all"
              ? "All Levels"
              : activeInfo
              ? activeInfo.programName
                ? `${activeInfo.name} — ${activeInfo.programName}`
                : activeInfo.name
              : "All Levels"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {grouped.map(({ programName, levels }) => (
            <div key={programName}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b mb-1 mt-1">
                {programName}
              </div>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>

      {filterLevelId !== "all" && activeInfo?.programName && (
        <p className="text-sm text-muted-foreground">
          Showing sections for{" "}
          <span className="font-medium text-foreground">{activeInfo.name}</span>{" "}
          in{" "}
          <span className="font-medium text-foreground">{activeInfo.programName}</span>
        </p>
      )}
    </div>
  );
}
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Program }       from "@/types/admin/program.types";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

interface SectionLevelFilterProps {
  programs:         Program[];
  filterProgramId:  string;
  onProgramChange:  (id: string) => void;
  filterLevelId:    string;
  onLevelChange:    (id: string) => void;
  grouped:          { programName: string; levels: EnrichedLevel[] }[];
  levelMap:         Record<string, { name: string; programName: string; programId: string }>;
}

export function SectionLevelFilter({
  programs,
  filterProgramId,
  onProgramChange,
  filterLevelId,
  onLevelChange,
  grouped,
  levelMap,
}: SectionLevelFilterProps): React.JSX.Element {
  const selectedProgram = programs.find((p) => p.id === filterProgramId);

  // Levels scoped to selected program
  const scopedGroup = grouped.find(
    (g) => g.programName === selectedProgram?.name
  );
  const scopedLevels = scopedGroup?.levels ?? [];

  const selectedLevelInfo = levelMap[filterLevelId];

  return (
    <div className="flex items-center gap-2">
      {/* Program select */}
      <Select
        value={filterProgramId}
        onValueChange={(v) => onProgramChange(v ?? "all")}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All Programs">
            {filterProgramId === "all"
              ? "All Programs"
              : (selectedProgram?.name ?? "All Programs")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level select — disabled until program selected */}
      <Select
        value={filterLevelId}
        onValueChange={(v) => onLevelChange(v ?? "all")}
        disabled={filterProgramId === "all"}
      >
        <SelectTrigger className="w-48">
          <SelectValue
            placeholder={
              filterProgramId === "all" ? "Select program first" : "All Levels"
            }
          >
            {filterLevelId === "all"
              ? filterProgramId === "all"
                ? "Select program first"
                : "All Levels"
              : (selectedLevelInfo?.name ?? "All Levels")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {scopedLevels.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
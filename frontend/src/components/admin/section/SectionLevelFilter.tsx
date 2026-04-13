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
  programs:        Program[];
  filterProgramId: string;
  onProgramChange: (id: string) => void;
  filterCourseId:  string;
  onCourseChange:  (id: string) => void;
  filterStrandId:  string;
  onStrandChange:  (id: string) => void;
  filterLevelId:   string;
  onLevelChange:   (id: string) => void;
  grouped:         { programName: string; levels: EnrichedLevel[] }[];
  levelMap:        Record<string, { name: string; programName: string; programId: string }>;
}

export function SectionLevelFilter({
  programs,
  filterProgramId,
  onProgramChange,
  filterCourseId,
  onCourseChange,
  filterStrandId,
  onStrandChange,
  filterLevelId,
  onLevelChange,
  grouped,
  levelMap,
}: SectionLevelFilterProps): React.JSX.Element {
  const selectedProgram = programs.find((p) => p.id === filterProgramId);

  const isCollege    = selectedProgram?.type === "college";
  const isSHS        = selectedProgram?.type === "shs";
  const hasSubGroups = isCollege || isSHS;

  const courses = selectedProgram?.courses ?? [];
  const strands = selectedProgram?.strands ?? [];

  // Level select is gated: needs program + (course or strand if applicable)
  const subGroupSatisfied =
    !hasSubGroups ||
    (isCollege ? filterCourseId !== "all" : filterStrandId !== "all");

  const levelSelectEnabled = filterProgramId !== "all" && subGroupSatisfied;

  // Scope levels to selected program only
  const scopedGroup  = grouped.find((g) => g.programName === selectedProgram?.name);
  const scopedLevels = scopedGroup?.levels ?? [];

  const selectedLevelInfo  = levelMap[filterLevelId];
  const selectedCourseName = courses.find((c) => c.id === filterCourseId);
  const selectedStrandName = strands.find((s) => s.id === filterStrandId);

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* ── Program ── */}
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

      {/* ── Course (college only) ── */}
      {isCollege && (
        <Select
          value={filterCourseId}
          onValueChange={(v) => onCourseChange(v ?? "all")}
          disabled={filterProgramId === "all"}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Courses">
              {filterCourseId === "all"
                ? "All Courses"
                : selectedCourseName
                  ? (selectedCourseName.code
                    ? `${selectedCourseName.code} – ${selectedCourseName.name}`
                    : selectedCourseName.name)
                  : "All Courses"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code ? `${c.code} – ${c.name}` : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ── Strand (SHS only) ── */}
      {isSHS && (
        <Select
          value={filterStrandId}
          onValueChange={(v) => onStrandChange(v ?? "all")}
          disabled={filterProgramId === "all"}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Strands">
              {filterStrandId === "all"
                ? "All Strands"
                : (selectedStrandName?.name ?? "All Strands")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strands</SelectItem>
            {strands.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* ── Level — always last, gated on sub-group satisfaction ── */}
      <Select
        value={filterLevelId}
        onValueChange={(v) => onLevelChange(v ?? "all")}
        disabled={!levelSelectEnabled}
      >
        <SelectTrigger className="w-44">
          <SelectValue
            placeholder={
              filterProgramId === "all"
                ? "Select program first"
                : hasSubGroups && !subGroupSatisfied
                ? isCollege
                  ? "Select course first"
                  : "Select strand first"
                : "All Levels"
            }
          >
            {filterLevelId === "all"
              ? filterProgramId === "all"
                ? "Select program first"
                : hasSubGroups && !subGroupSatisfied
                ? isCollege
                  ? "Select course first"
                  : "Select strand first"
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
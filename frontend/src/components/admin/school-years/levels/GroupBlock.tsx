"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { LevelListSharedProps } from "./types";
import { LevelList } from "./LevelList";

interface GroupBlockProps extends LevelListSharedProps {
  label:  string;
  levels: Level[];
  groupId: string;
  groupType: "course" | "strand";
}

function GroupBlock({
  label,
  levels,
  groupId,
  groupType,
  ...listProps
}: GroupBlockProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-t">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted shrink-0">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium flex-1 min-w-0 truncate">{label}</span>
        <Badge variant="outline" className="text-xs font-normal shrink-0">
          {levels.length} {levels.length === 1 ? "level" : "levels"}
        </Badge>
        {collapsed
          ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
      </button>
      {!collapsed && (
        <div className="bg-muted/5">
          <LevelList
            levels={levels}
            courseId={groupType === "course" ? groupId : undefined}
            strandId={groupType === "strand" ? groupId : undefined}
            {...listProps}
          />
        </div>
      )}
    </div>
  );
}

export function CourseGroupBlock({
  course,
  levels,
  ...listProps
}: { course: CourseSnapshot; levels: Level[] } & LevelListSharedProps): React.JSX.Element {
  const label = course.code ? `${course.code} – ${course.name}` : course.name;
  return <GroupBlock label={label} levels={levels} groupId={course.id} groupType="course" {...listProps} />;
}

export function StrandGroupBlock({
  strand,
  levels,
  ...listProps
}: { strand: StrandSnapshot; levels: Level[] } & LevelListSharedProps): React.JSX.Element {
  return <GroupBlock label={strand.name} levels={levels} groupId={strand.id} groupType="strand" {...listProps} />;
}
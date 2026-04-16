"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { Level } from "@/types/admin/level.types";
import type { LevelListSharedProps } from "./types";

import { LevelList } from "./LevelList";

interface Props extends LevelListSharedProps {
  label: string;
  groupId: string;
  groupType: "course" | "strand";
  levels: Level[]; // 🔥 IMPORTANT
}

export function GroupBlock({
  label,
  groupId,
  groupType,
  levels,
  ...props
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // 🔥 NO FETCH, NO FILTERING HERE
  const scopedLevels = levels;

  return (
    <div className="border-t">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-2.5"
      >
        <GraduationCap className="h-3 w-3" />
        <span className="flex-1 text-sm">{label}</span>

        <Badge>{scopedLevels.length}</Badge>

        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {!collapsed && (
        <LevelList
          levels={scopedLevels}
          {...props}
        />
      )}
    </div>
  );
}
/* =========================
   SAFE WRAPPERS
   ========================= */

export function CourseGroupBlock({
  course,
  ...props
}: { course: CourseSnapshot } & LevelListSharedProps & {
  programId: string;
}): React.JSX.Element {
  const label = course.code
    ? `${course.code} – ${course.name}`
    : course.name;

  return (
    <GroupBlock
      label={label}
      groupId={course.id}
      groupType="course"
      {...props}
    />
  );
}

export function StrandGroupBlock({
  strand,
  ...props
}: { strand: StrandSnapshot } & LevelListSharedProps & {
  programId: string;
}): React.JSX.Element {
  return (
    <GroupBlock
      label={strand.name}
      groupId={strand.id}
      groupType="strand"
      {...props}
    />
  );
}
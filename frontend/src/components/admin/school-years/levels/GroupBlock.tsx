"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { LevelListSharedProps } from "./types";

import { LevelList } from "./LevelList";
import { levelApi } from "@/api/admin/level.api";

interface GroupBlockProps extends LevelListSharedProps {
  label: string;
  groupId: string;
  groupType: "course" | "strand";
  programId: string;
}

export function GroupBlock({
  label,
  groupId,
  groupType,
  schoolYearId,
  programId,
  ...listProps
}: GroupBlockProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  // ✅ single source of truth
  const { data: allLevels = [], isLoading } = useQuery<Level[]>({
    queryKey: ["admin", "levels", schoolYearId, programId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
  });

  // ✅ ONLY filter by program (safe)
  const programLevels = allLevels.filter(
    (l) => l.program_id === programId
  );

  // ⚠️ IMPORTANT:
  // No real relation exists between level ↔ course/strand
  // so we DO NOT filter them out anymore.

  const levels = programLevels;

  return (
    <div className="border-t">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-muted shrink-0">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
        </div>

        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          {label}
        </span>

        <Badge variant="outline" className="text-xs font-normal shrink-0">
          {levels.length} {levels.length === 1 ? "level" : "levels"}
        </Badge>

        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="bg-muted/5">
          {isLoading ? (
            <div className="px-4 py-2 space-y-1.5">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : (
            <LevelList
              levels={levels}
              schoolYearId={schoolYearId}
              courseId={groupType === "course" ? groupId : undefined}
              strandId={groupType === "strand" ? groupId : undefined}
              {...listProps}
            />
          )}
        </div>
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
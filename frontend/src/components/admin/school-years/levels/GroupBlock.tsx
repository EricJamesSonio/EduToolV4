"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  isEnded,
  programType,
  onViewSubjects,
  onRename,
  onDelete,
  onAdd,
  onGenerate,
  isUpdating,
  isAdding,
  isGenerating,
  updatingId,
}: GroupBlockProps): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  const { data: allLevels = [], isLoading } = useQuery<Level[]>({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
  });

  const levels = allLevels.filter((l) => l.program_id === programId || !l.program_id);

  return (
    <div className="border-t">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30"
      >
        <GraduationCap className="h-3 w-3 text-muted-foreground" />

        <span className="text-sm font-medium flex-1 truncate">
          {label}
        </span>

        <Badge variant="outline" className="text-xs">
          {levels.length}
        </Badge>

        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {!collapsed && (
        <div className="bg-muted/5">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <LevelList
              levels={levels}
              schoolYearId={schoolYearId}
              isEnded={isEnded}
              programType={programType}
              onViewSubjects={onViewSubjects}
              onRename={onRename}
              onDelete={onDelete}
              onAdd={onAdd}
              onGenerate={onGenerate}
              isUpdating={isUpdating}
              isAdding={isAdding}
              isGenerating={isGenerating}
              updatingId={updatingId}
              courseId={groupType === "course" ? groupId : undefined}
              strandId={groupType === "strand" ? groupId : undefined}
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
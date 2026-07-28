"use client";
import { useState } from "react";
import { Plus, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level } from "@/types/admin/level.types";
import type { LevelListSharedProps } from "./types";
import { LevelRow }          from "./LevelRow";
import { GenerateLevelsRow } from "./GenerateLevelsRow";

interface LevelListProps extends LevelListSharedProps {
  levels:    Level[];
  courseId?: string;
  strandId?: string;
}

export function LevelList({
  levels,
  schoolYearId,
  isEnded,
  programType,
  courseId,
  strandId,
  onViewSubjects,
  onRename,
  onDelete,
  onAdd,
  onGenerate,
  isUpdating,
  isAdding,
  isGenerating,
  updatingId,
}: LevelListProps): React.JSX.Element {
  const [showGenerate, setShowGenerate] = useState(false);
  const indented = !!(courseId || strandId);

  return (
    <div className="divide-y">
      {levels.length === 0 && !showGenerate && (
        <p className={cn("py-3 text-xs text-muted-foreground not-interactive", indented ? "pl-10" : "px-4")}>
          No levels yet.
        </p>
      )}

      {levels.map((level) => (
        <LevelRow
          key={level.id}
          level={level}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          courseId={courseId}
          strandId={strandId}
          onViewSubjects={onViewSubjects}
          onRename={onRename}
          onDelete={onDelete}
          isUpdating={isUpdating && updatingId === level.id}
          indented={indented}
        />
      ))}

      {!isEnded && showGenerate && (
        <GenerateLevelsRow
          programType={programType}
          onGenerate={(count) => { onGenerate(count); setShowGenerate(false); }}
          onCancel={() => setShowGenerate(false)}
          isLoading={isGenerating}
        />
      )}

      {!isEnded && !showGenerate && (
        <div className={cn("py-2 flex items-center gap-4", indented ? "pl-10 pr-4" : "px-4")}>
          <button
            onClick={onAdd}
            disabled={isAdding}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {isAdding ? "Adding…" : "Add level"}
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Generate levels
          </button>
        </div>
      )}
    </div>
  );
}
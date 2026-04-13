"use client";
import { useState } from "react";
import { ChevronRight, BookOpen, Pencil, Trash2 } from "lucide-react";
import { InlineEdit }    from "@/components/admin/levels/InlineEdit";
import { Button }        from "@/components/ui/button";
import { SectionsPanel } from "../SectionsPanel";
import { cn }            from "@/lib/utils";
import type { Level } from "@/types/admin/level.types";

interface LevelRowProps {
  level:           Level;
  schoolYearId:    string;
  isEnded:         boolean;
  courseId?:       string;
  strandId?:       string;
  onViewSubjects?: (levelId: string) => void;
  onRename:        (id: string, name: string) => void;
  onDelete:        (level: Level) => void;
  isUpdating:      boolean;
  indented?:       boolean;
}

export function LevelRow({
  level,
  schoolYearId,
  isEnded,
  courseId,
  strandId,
  onViewSubjects,
  onRename,
  onDelete,
  isUpdating,
  indented,
}: LevelRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [editing,  setEditing]  = useState(false);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 hover:bg-muted/20 transition-colors group",
          indented ? "pl-10 pr-4" : "px-4",
        )}
      >
        {editing ? (
          <div className="flex-1">
            <InlineEdit
              value={level.name}
              onSave={(name) => { onRename(level.id, name); setEditing(false); }}
              onCancel={() => setEditing(false)}
              isLoading={isUpdating}
            />
          </div>
        ) : (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                  expanded && "rotate-90",
                )}
              />
              <span className="text-sm font-medium truncate">{level.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">— sections</span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {onViewSubjects && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => onViewSubjects(level.id)}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  View Subjects
                </Button>
              )}
              {!isEnded && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename level"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(level)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete level"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {expanded && !editing && (
        <SectionsPanel
          level={level}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          courseId={courseId}
          strandId={strandId}
        />
      )}
    </div>
  );
}
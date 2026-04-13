"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { levelApi }   from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import type { Level }                          from "@/types/admin/level.types";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { InlineEdit }    from "@/components/admin/levels/InlineEdit";
import { getCountConfig } from "@/components/admin/levels/get-count-config";
import { Skeleton }      from "@/components/ui/skeleton";
import { Badge }         from "@/components/ui/badge";
import { Button }        from "@/components/ui/button";
import { SectionsPanel } from "./SectionsPanel";
import { cn }            from "@/lib/utils";

interface LevelWithSectionsListProps {
  schoolYearId:    string;
  programId:       string;
  isEnded:         boolean;
  onViewSubjects?: (levelId: string) => void;
}

// ─── Generate levels bar (copied from ProgramGroup's GenerateLevelsRow) ───────
function GenerateLevelsRow({
  programType,
  onGenerate,
  onCancel,
  isLoading,
}: {
  programType: string;
  onGenerate:  (count: number) => void;
  onCancel:    () => void;
  isLoading:   boolean;
}): React.JSX.Element {
  const cfg = getCountConfig(programType);
  const [count, setCount] = useState(cfg.default);
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-t flex-wrap">
      <span className="text-sm text-muted-foreground">{cfg.label}:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCount((c) => Math.max(cfg.min, c - 1))}
          disabled={count <= cfg.min}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >−</button>
        <span className="w-6 text-center text-sm font-medium">{count}</span>
        <button
          onClick={() => setCount((c) => Math.min(cfg.max, c + 1))}
          disabled={count >= cfg.max}
          className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
        >+</button>
      </div>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
        {cfg.preview(count)}
      </span>
      <div className="flex items-center gap-2 ml-auto">
        <Button size="sm" className="h-7 text-xs px-3" onClick={() => onGenerate(count)} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs px-3" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Single level row: rename + expand → SectionsPanel ───────────────────────
function LevelRow({
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
}: {
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
}): React.JSX.Element {
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
            {/* Expand toggle */}
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

            {/* Actions */}
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

      {/* Inline sections panel */}
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

// ─── Flat level list + action bar ─────────────────────────────────────────────
function LevelList({
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
}: {
  levels:          Level[];
  schoolYearId:    string;
  isEnded:         boolean;
  programType:     string;
  courseId?:       string;
  strandId?:       string;
  onViewSubjects?: (levelId: string) => void;
  onRename:        (id: string, name: string) => void;
  onDelete:        (level: Level) => void;
  onAdd:           () => void;
  onGenerate:      (count: number) => void;
  isUpdating:      boolean;
  isAdding:        boolean;
  isGenerating:    boolean;
  updatingId:      string | null;
}): React.JSX.Element {
  const [showGenerate, setShowGenerate] = useState(false);
  const indented = !!(courseId || strandId);

  return (
    <div className="divide-y">
      {levels.length === 0 && !showGenerate && (
        <p className={cn("py-3 text-xs text-muted-foreground", indented ? "pl-10" : "px-4")}>
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

// ─── Collapsible course group ─────────────────────────────────────────────────
function CourseGroupBlock({
  course,
  levels,
  listProps,
}: {
  course:    CourseSnapshot;
  levels:    Level[];
  listProps: Omit<React.ComponentProps<typeof LevelList>, "levels" | "courseId" | "strandId">;

}): React.JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const label = course.code ? `${course.code} – ${course.name}` : course.name;

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
          <LevelList levels={levels} courseId={course.id} {...listProps} />
        </div>
      )}
    </div>
  );
}

// ─── Collapsible strand group ─────────────────────────────────────────────────
function StrandGroupBlock({
  strand,
  levels,
  listProps,
}: {
  strand:    StrandSnapshot;
  levels:    Level[];
  listProps: Omit<React.ComponentProps<typeof LevelList>, "levels" | "courseId" | "strandId">;
}): React.JSX.Element {
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
        <span className="text-sm font-medium flex-1 min-w-0 truncate">{strand.name}</span>
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
          <LevelList levels={levels} strandId={strand.id} {...listProps} />
        </div>
      )}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export function LevelWithSectionsList({
  schoolYearId,
  programId,
  isEnded,
  onViewSubjects,
}: LevelWithSectionsListProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);

  const { data: program } = useQuery({
    queryKey: ["admin", "program", programId],
    queryFn:  () => programApi.getOne(programId),
  });

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const levels = allLevels.filter((l) => l.program_id === programId);

  const isCollege = program?.type === "college";
  const isSHS     = program?.type === "shs";

  const courses: CourseSnapshot[] = program?.courses ?? [];
  const strands: StrandSnapshot[] = program?.strands ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSuccess: () => { toast.success("Level renamed."); invalidate(); },
    onError:   () => toast.error("Failed to rename level."),
    onSettled: () => setUpdatingId(null),
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => { toast.success("Levels generated."); invalidate(); },
    onError:   () => toast.error("Failed to generate levels."),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      levelApi.create({ programId, name, schoolYearId }),
    onSuccess: () => { toast.success("Level added."); invalidate(); },
    onError:   () => toast.error("Failed to add level."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => {
      toast.success("Level deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete level."),
  });

  if (isLoading || !program) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

const listProps = {
    schoolYearId,
    isEnded,
    programType:  program.type,
    onViewSubjects,                // ← add this
    onRename:     (id: string, name: string) => updateMutation.mutate({ id, name }),
    onDelete:     (level: Level) => setDeleteTarget(level),
    onAdd:        () => createMutation.mutate(`Level ${levels.length + 1}`),
    onGenerate:   (count: number) => generateMutation.mutate(count),
    isUpdating:   updateMutation.isPending,
    isAdding:     createMutation.isPending,
    isGenerating: generateMutation.isPending,
    updatingId,
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Levels & Sections</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {levels.length}
          </Badge>
        </div>

        {/* ── Flat: non-college, non-SHS ── */}
        {!isCollege && !isSHS && (
          <LevelList
            levels={levels}
            onViewSubjects={onViewSubjects}
            {...listProps}
          />
        )}

        {/* ── College: grouped by course ── */}
        {isCollege && (
          courses.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No courses found. Add courses first from the Programs page.
            </p>
          ) : (
            <div>
              {courses.map((course) => (
                <CourseGroupBlock
                  key={course.id}
                  course={course}
                  levels={levels}
                  listProps={listProps}
                />
              ))}
            </div>
          )
        )}

        {/* ── SHS: grouped by strand ── */}
        {isSHS && (
          strands.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">
              No strands found. Add strands first from the Programs page.
            </p>
          ) : (
            <div>
              {strands.map((strand) => (
                <StrandGroupBlock
                  key={strand.id}
                  strand={strand}
                  levels={levels}
                  listProps={listProps}
                />
              ))}
            </div>
          )
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}
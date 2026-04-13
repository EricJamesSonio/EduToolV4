"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronRight,
  Layers,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { levelApi }   from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import type { Level }                        from "@/types/admin/level.types";
import type { CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton }      from "@/components/ui/skeleton";
import { Badge }         from "@/components/ui/badge";
import { Button }        from "@/components/ui/button";
import { ProgramGroup }  from "@/components/admin/levels/ProgramGroup";
import { SectionsPanel } from "./SectionsPanel";
import { cn }            from "@/lib/utils";

interface LevelWithSectionsListProps {
  schoolYearId:    string;
  programId:       string;
  isEnded:         boolean;
  onViewSubjects?: (levelId: string) => void;
}

// ─── Flat (non-college / non-SHS) ────────────────────────────────────────────
function FlatLevels({
  levels,
  schoolYearId,
  isEnded,
  onViewSubjects,
}: {
  levels:          Level[];
  schoolYearId:    string;
  isEnded:         boolean;
  onViewSubjects?: (levelId: string) => void;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="border-t divide-y">
      {levels.map((level) => (
        <div key={level.id}>
          <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors">
            <button
              onClick={() => toggle(level.id)}
              className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                  expanded.has(level.id) && "rotate-90",
                )}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {level.name}
              </span>
              <span className="text-xs text-muted-foreground">— sections</span>
            </button>
            {onViewSubjects && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                onClick={() => onViewSubjects(level.id)}
              >
                <BookOpen className="h-3 w-3 mr-1" />
                View Subjects
              </Button>
            )}
          </div>
          {expanded.has(level.id) && (
            <SectionsPanel
              level={level}
              schoolYearId={schoolYearId}
              isEnded={isEnded}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── College: Course → Levels → Sections ─────────────────────────────────────
function CollegeLevels({
  courses,
  levels,
  schoolYearId,
  isEnded,
}: {
  courses:      CourseSnapshot[];
  levels:       Level[];
  schoolYearId: string;
  isEnded:      boolean;
}): React.JSX.Element {
  // key = `${courseId}:${levelId}`
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // track which courses are collapsed
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(new Set());

  const toggleLevel = (courseId: string, levelId: string) => {
    const key = `${courseId}:${levelId}`;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleCourse = (courseId: string) =>
    setCollapsedCourses((prev) => {
      const next = new Set(prev);
      next.has(courseId) ? next.delete(courseId) : next.add(courseId);
      return next;
    });

  if (courses.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground border-t">
        No courses found for this program.
      </p>
    );
  }

  return (
    <div className="border-t divide-y">
      {courses.map((course) => {
        const isCourseCollapsed = collapsedCourses.has(course.id);
        return (
          <div key={course.id}>
            {/* Course header row */}
            <button
              onClick={() => toggleCourse(course.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                  !isCourseCollapsed && "rotate-90",
                )}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {course.code ? `${course.code} – ${course.name}` : course.name}
              </span>
            </button>

            {/* Levels under this course */}
            {!isCourseCollapsed && (
              <div className="divide-y">
                {levels.map((level) => {
                  const key = `${course.id}:${level.id}`;
                  return (
                    <div key={level.id}>
                      <button
                        onClick={() => toggleLevel(course.id, level.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 pl-10 hover:bg-muted/30 transition-colors text-left"
                      >
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                            expanded.has(key) && "rotate-90",
                          )}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {level.name}
                        </span>
                        <span className="text-xs text-muted-foreground">— sections</span>
                      </button>
                      {expanded.has(key) && (
                        <SectionsPanel
                          level={level}
                          schoolYearId={schoolYearId}
                          isEnded={isEnded}
                          courseId={course.id}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SHS: Strand → Levels → Sections ─────────────────────────────────────────
function SHSLevels({
  strands,
  levels,
  schoolYearId,
  isEnded,
}: {
  strands:      StrandSnapshot[];
  levels:       Level[];
  schoolYearId: string;
  isEnded:      boolean;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsedStrands, setCollapsedStrands] = useState<Set<string>>(new Set());

  const toggleLevel = (strandId: string, levelId: string) => {
    const key = `${strandId}:${levelId}`;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleStrand = (strandId: string) =>
    setCollapsedStrands((prev) => {
      const next = new Set(prev);
      next.has(strandId) ? next.delete(strandId) : next.add(strandId);
      return next;
    });

  if (strands.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-muted-foreground border-t">
        No strands found for this program.
      </p>
    );
  }

  return (
    <div className="border-t divide-y">
      {strands.map((strand) => {
        const isStrandCollapsed = collapsedStrands.has(strand.id);
        return (
          <div key={strand.id}>
            {/* Strand header row */}
            <button
              onClick={() => toggleStrand(strand.id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                  !isStrandCollapsed && "rotate-90",
                )}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {strand.name}
              </span>
            </button>

            {!isStrandCollapsed && (
              <div className="divide-y">
                {levels.map((level) => {
                  const key = `${strand.id}:${level.id}`;
                  return (
                    <div key={level.id}>
                      <button
                        onClick={() => toggleLevel(strand.id, level.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 pl-10 hover:bg-muted/30 transition-colors text-left"
                      >
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                            expanded.has(key) && "rotate-90",
                          )}
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          {level.name}
                        </span>
                        <span className="text-xs text-muted-foreground">— sections</span>
                      </button>
                      {expanded.has(key) && (
                        <SectionsPanel
                          level={level}
                          schoolYearId={schoolYearId}
                          isEnded={isEnded}
                          strandId={strand.id}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
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

  const isCollege    = program?.type === "college";
  const isSHS        = program?.type === "shs";
  const hasSubGroups = isCollege || isSHS;

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

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              {hasSubGroups ? "Levels & Sections" : "Levels & Sections"}
            </span>
            <Badge variant="secondary" className="text-xs font-normal">
              {levels.length}
            </Badge>
          </div>
        </div>

        {/* ProgramGroup: handles level CRUD UI (rename, delete, generate, add) */}
        <ProgramGroup
          program={program}
          levels={levels}
          isEnded={isEnded}
          onUpdate={(id, name) => updateMutation.mutate({ id, name })}
          onDelete={(level) => setDeleteTarget(level)}
          onGenerate={(_pid, count) => generateMutation.mutate(count)}
          onAdd={() => createMutation.mutate(`Level ${levels.length + 1}`)}
          isUpdating={updateMutation.isPending}
          isGenerating={generateMutation.isPending}
          isAdding={createMutation.isPending}
          updatingId={updatingId}
        />

        {/* Sections — nested by program type */}
        {levels.length > 0 && !hasSubGroups && (
          <FlatLevels
            levels={levels}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
            onViewSubjects={onViewSubjects}
          />
        )}

        {levels.length > 0 && isCollege && (
          <CollegeLevels
            courses={courses}
            levels={levels}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
          />
        )}

        {levels.length > 0 && isSHS && (
          <SHSLevels
            strands={strands}
            levels={levels}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
          />
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
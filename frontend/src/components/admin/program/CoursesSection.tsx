"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, ChevronRight, Layers } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteCourse } from "@/hooks/admin/useCourses";
import { levelApi } from "@/api/admin/level.api";
import { CourseDialog } from "./CourseDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SectionsPanel } from "@/components/admin/school-years/SectionsPanel";
import { ProgramGroup } from "@/components/admin/levels/ProgramGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourseSnapshot } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import { cn } from "@/lib/utils";

interface CoursesSectionProps {
  program:      Program;
  schoolYearId: string;
  courses:      CourseSnapshot[];
  isEnded:      boolean;
}

interface CourseLevelsProps {
  course:       CourseSnapshot;
  program:      Program;
  schoolYearId: string;
  isEnded:      boolean;
  allLevels:    Level[];
  onLevelsChange: () => void;
}

function CourseLevels({
  course,
  program,
  schoolYearId,
  isEnded,
  allLevels,
  onLevelsChange,
}: CourseLevelsProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [expandedLevelIds, setExpandedLevelIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);

  const levels = allLevels.filter((l) => l.program_id === program.id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });
    onLevelsChange();
  };

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
      levelApi.bulkGenerate({ programId: program.id, schoolYearId, count }),
    onSuccess: () => { toast.success("Levels generated."); invalidate(); },
    onError:   () => toast.error("Failed to generate levels."),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      levelApi.create({ programId: program.id, name, schoolYearId }),
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

  const toggleLevel = (levelId: string) => {
    setExpandedLevelIds((prev) => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId); else next.add(levelId);
      return next;
    });
  };

  return (
    <>
      {/* Level CRUD toolbar via ProgramGroup */}
      <div className="border-t bg-muted/10">
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

        {/* Level rows with inline sections */}
        {levels.length > 0 && (
          <div className="border-t divide-y">
            {levels.map((level) => (
              <div key={level.id}>
                <button
                  onClick={() => toggleLevel(level.id)}
                  className="w-full flex items-center gap-2 px-6 py-2.5 hover:bg-muted/30 transition-colors text-left"
                >
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                      expandedLevelIds.has(level.id) && "rotate-90",
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {level.name}
                  </span>
                  <span className="text-xs text-muted-foreground">— sections</span>
                </button>

                {expandedLevelIds.has(level.id) && (
                  <SectionsPanel
                    level={level}
                    schoolYearId={schoolYearId}
                    isEnded={isEnded}
                    courseId={course.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Any classes or students linked to this level may be affected.`}
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

export function CoursesSection({
  program,
  schoolYearId,
  courses,
  isEnded,
}: CoursesSectionProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    course?: { id: string; name: string; code: string | null };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseSnapshot | null>(null);

  const deleteMutation = useDeleteCourse();

  const { data: allLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const toggleCourse = (courseId: string) => {
    setExpandedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId); else next.add(courseId);
      return next;
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Course deleted.");
        setDeleteTarget(null);
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to delete course.");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Courses</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {courses.length}
            </Badge>
          </div>
          {!isEnded && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={() => setDialog({ mode: "create" })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Course
            </Button>
          )}
        </div>

        {/* Course list */}
        {levelsLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No courses yet.</p>
            {!isEnded && (
              <button
                onClick={() => setDialog({ mode: "create" })}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Add the first course
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {courses.map((course) => {
              const isExpanded = expandedCourseIds.has(course.id);
              return (
                <div key={course.id}>
                  {/* Course row */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/20 transition-colors",
                      isExpanded && "bg-muted/20",
                    )}
                  >
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                          isExpanded && "rotate-90",
                        )}
                      />
                      <span className="text-sm font-medium truncate">{course.name}</span>
                      {course.code && (
                        <Badge variant="outline" className="text-xs font-mono shrink-0">
                          {course.code}
                        </Badge>
                      )}
                    </button>

                    {/* Edit / Delete */}
                    {!isEnded && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() =>
                            setDialog({
                              mode: "edit",
                              course: { id: course.id, name: course.name, code: course.code },
                            })
                          }
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(course)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded: levels + sections */}
                  {isExpanded && (
                    <CourseLevels
                      course={course}
                      program={program}
                      schoolYearId={schoolYearId}
                      isEnded={isEnded}
                      allLevels={allLevels}
                      onLevelsChange={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["admin", "levels", schoolYearId],
                        })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dialog && (
        <CourseDialog
          programId={program.id}
          schoolYearId={schoolYearId}
          course={dialog.course}
          open
          onClose={() => setDialog(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this course?"
          message={`Delete "${deleteTarget.name}"? Any subjects or classes linked to this course may be affected.`}
          confirmLabel="Delete Course"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteCourse } from "@/hooks/admin/useCourses";
import { CourseDialog } from "./CourseDialog";
import { ProgramLevelsSection } from "./ProgramLevelsSection";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pickCardColor, cardGridClass } from "@/lib/utils";
import type { CourseSnapshot, Program } from "@/types/admin/program.types";

interface CoursesSectionProps {
  program: Program;
  schoolYearId: string;
  courses: CourseSnapshot[];
  isEnded: boolean;
}

export function CoursesSection({
  program,
  schoolYearId,
  courses,
  isEnded,
}: CoursesSectionProps): React.JSX.Element {
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    course?: { id: string; name: string; code: string | null };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseSnapshot | null>(null);

  const deleteMutation = useDeleteCourse();

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ id: deleteTarget.id, schoolYearId }, {
      onSuccess: () => { toast.success("Course deleted."); setDeleteTarget(null); },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to delete course.");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base not-interactive">Courses</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {courses.length}
          </Badge>
        </div>
        {!isEnded && (
          <Button
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Course
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground not-interactive">No courses yet.</p>
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
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`icon-container ${pickCardColor(course.id)} shrink-0 mt-0.5`}>
                  <BookOpen className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate not-interactive">{course.name}</h3>
                  {course.code && (
                    <Badge variant="outline" className="text-xs font-mono mt-1">
                      {course.code}
                    </Badge>
                  )}
                </div>
                {!isEnded && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setDialog({
                          mode: "edit",
                          course: { id: course.id, name: course.name, code: course.code },
                        })
                      }
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit course"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(course)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Levels scoped to this course */}
              <div className="border-t pt-4">
                <ProgramLevelsSection
                  programId={program.id}
                  schoolYearId={schoolYearId}
                  programType={program.type}
                  courseId={course.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteCourse } from "@/hooks/admin/useCourses";
import { CourseDialog } from "./CourseDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseSnapshot } from "@/types/admin/program.types";

interface CoursesSectionProps {
  programId:    string;
  schoolYearId: string;
  courses:      CourseSnapshot[];
}

export function CoursesSection({
  programId,
  schoolYearId,
  courses,
}: CoursesSectionProps): React.JSX.Element {
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    course?: { id: string; name: string; code: string | null };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseSnapshot | null>(null);

  const deleteMutation = useDeleteCourse();

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
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Courses</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {courses.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Course
          </Button>
        </div>

        {courses.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No courses yet.</p>
            <button
              onClick={() => setDialog({ mode: "create" })}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Add the first course
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{course.name}</span>
                  {course.code && (
                    <Badge variant="outline" className="text-xs font-mono shrink-0">
                      {course.code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() =>
                      setDialog({ mode: "edit", course: { id: course.id, name: course.name, code: course.code } })
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
              </div>
            ))}
          </div>
        )}
      </div>

      {dialog && (
        <CourseDialog
          programId={programId}
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
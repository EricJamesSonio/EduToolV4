"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteCourse } from "@/hooks/admin/useCourses";
import { CourseDialog } from "./CourseDialog";
import { ProgramUnitCard } from "./ProgramUnitCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CardGrid } from "@/components/shared/CardGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
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
          <Button size="sm" className="h-8 text-xs px-3" onClick={() => setDialog({ mode: "create" })}>
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
        <CardGrid count={courses.length}>
          {courses.map((course) => (
            <ProgramUnitCard
              key={course.id}
              name={course.name}
              code={course.code}
              icon={BookOpen}
              iconClass="bg-[#BFDBFE] text-[#0B1E3A] border-[#93C5FD]"
              levelCount={course.levelCount ?? 0}
              sectionCount={course.sectionCount ?? 0}
              isEnded={isEnded}
              onView={() => router.push(`/admin/programs/${program.id}/courses/${course.id}`)}
              onEdit={() =>
                setDialog({
                  mode: "edit",
                  course: { id: course.id, name: course.name, code: course.code },
                })
              }
              onDelete={() => setDeleteTarget(course)}
            />
          ))}
        </CardGrid>
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
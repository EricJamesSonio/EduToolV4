"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStudentLesson, useStudentLessons } from "@/hooks/student/usestudentLessons";
import type { StudentLesson } from "@/api/student/lesson.api";

export default function StudentLessonDetailPage(): React.JSX.Element {
  const { classId, lessonId } = useParams<{ classId: string; lessonId: string }>();
  const router = useRouter();

  const { data: lesson, isLoading } = useStudentLesson(classId, lessonId);
  const { data: allLessonsRaw } = useStudentLessons(classId);
  const allLessons: StudentLesson[] = Array.isArray(allLessonsRaw)
    ? allLessonsRaw
    : (((allLessonsRaw as unknown) as Record<string, unknown>)?.data as StudentLesson[] ?? []);

  const sorted = [...allLessons].sort(
    (a, b) => a.weekNumber - b.weekNumber || a.subIndex - b.subIndex
  );
  const currentIndex = sorted.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextLesson = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  if (isLoading || !lesson) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading lesson...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={lesson.title}
        breadcrumbs={[
          { label: "Lessons", href: `/student/classes/${classId}/lessons` },
          { label: lesson.title },
        ]}
      />

      <div className="rounded-lg border bg-card divide-y divide-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-24 text-sm text-muted-foreground shrink-0">Title</span>
          <span className="text-sm font-medium">{lesson.title}</span>
        </div>
        {lesson.description && (
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-24 text-sm text-muted-foreground shrink-0">Description</span>
            <span className="text-sm">{lesson.description}</span>
          </div>
        )}
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-24 text-sm text-muted-foreground shrink-0">Week</span>
          <span className="text-sm">Week {lesson.weekNumber}</span>
        </div>
        <div className="px-6 py-4 space-y-1.5">
          <span className="text-sm text-muted-foreground">Lesson Detail</span>
          {lesson.detail ? (
            <div
              className="text-sm prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: lesson.detail }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No content available.</p>
          )}
        </div>
      </div>

      {/* Prev / Next navigation */}
      {allLessons.length > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={() =>
              prevLesson &&
              router.push(`/student/classes/${classId}/lessons/${prevLesson.id}`)
            }
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous Lesson
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextLesson}
            onClick={() =>
              nextLesson &&
              router.push(`/student/classes/${classId}/lessons/${nextLesson.id}`)
            }
            className="gap-1.5"
          >
            Next Lesson
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

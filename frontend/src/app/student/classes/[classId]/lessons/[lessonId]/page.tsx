"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useStudentLesson, useStudentLessons } from "@/hooks/student/usestudentLessons";
import { StudentLesson } from "@/api/student/lesson.api";

export default function StudentLessonDetailPage(): React.JSX.Element {
  const { classId, lessonId } = useParams<{ classId: string; lessonId: string }>();
  const router = useRouter();

  const { data: lesson, isLoading } = useStudentLesson(classId, lessonId);
    const { data: allLessonsRaw } = useStudentLessons(classId);
    const allLessons: StudentLesson[] = Array.isArray(allLessonsRaw)
    ? allLessonsRaw
    : (((allLessonsRaw as unknown) as Record<string, unknown>)?.data as StudentLesson[] ?? []);

  // Sort all lessons by week then subIndex for prev/next nav
  const sorted = [...allLessons].sort(
    (a, b) => a.weekNumber - b.weekNumber || a.subIndex - b.subIndex
  );
  const currentIndex = sorted.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextLesson = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
        onClick={() => router.push(`/student/classes/${classId}/lessons`)}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Lessons
      </Button>

      {/* Title + Content */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <Skeleton className="h-7 w-64" />
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Week {lesson?.weekNumber}
              </p>
              <h1 className="text-xl font-semibold text-foreground">
                {lesson?.title}
              </h1>
              {lesson?.description && (
                <p className="text-sm text-muted-foreground">{lesson.description}</p>
              )}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : lesson?.detail ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: lesson.detail }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No content available.</p>
          )}
        </CardContent>
      </Card>

      {/* Prev / Next navigation */}
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
    </div>
  );
}
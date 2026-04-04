"use client";

import { useParams, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStudentLessons } from "@/hooks/student/usestudentLessons";
import type { StudentLesson } from "@/api/student/lesson.api";

export default function StudentLessonsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: lessons = [], isLoading } = useStudentLessons(classId);

  // Group lessons by weekNumber
  const byWeek = lessons.reduce<Record<number, StudentLesson[]>>((acc, lesson) => {
    if (!acc[lesson.weekNumber]) acc[lesson.weekNumber] = [];
    acc[lesson.weekNumber].push(lesson);
    return acc;
  }, {});

  const weeks = Object.keys(byWeek)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <PageHeader title="Lessons" />

      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((w) => (
            <div key={w} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && lessons.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No lessons yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Lessons will appear here once your educator publishes them
          </p>
        </div>
      )}

      {!isLoading && weeks.map((week) => (
        <div key={week} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Week {week}
          </h2>
          <div className="space-y-2">
            {byWeek[week]
              .sort((a, b) => a.subIndex - b.subIndex)
              .map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lesson.title}
                    </p>
                    {lesson.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {lesson.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() =>
                      router.push(`/student/classes/${classId}/lessons/${lesson.id}`)
                    }
                  >
                    View
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
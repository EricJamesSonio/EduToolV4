"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStudentLessons } from "@/hooks/student/usestudentLessons";
import type { StudentLesson } from "@/api/student/lesson.api";

export default function StudentLessonsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: lessonsRaw, isLoading } = useStudentLessons(classId);
  const lessons: StudentLesson[] = Array.isArray(lessonsRaw)
    ? lessonsRaw
    : (((lessonsRaw as unknown) as Record<string, unknown>)?.data as StudentLesson[] ?? []);

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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((w) => (
            <div key={w} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-md shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
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

      {!isLoading && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weeks.map((week) => (
            <div
              key={week}
              className="rounded-xl border bg-card p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[(week - 1) % WEEK_COLORS.length])}>
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-lg leading-tight">Week {week}</h3>
              </div>

              <div className="space-y-2">
                {byWeek[week]
                  ?.sort((a, b) => (a.subIndex ?? 0) - (b.subIndex ?? 0))
                  .map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/student/classes/${classId}/lessons/${lesson.id}`}
                      className="block text-sm font-medium rounded-lg border bg-card px-4 py-3 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                    >
                      {lesson.title}
                      {lesson.description && (
                        <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">
                          {lesson.description}
                        </p>
                      )}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <Skeleton className="h-6 w-20 rounded-md" />
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-4 w-40" />
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
               <p className={cn("inline-block rounded-md px-2.5 py-1 text-xs font-semibold", WEEK_COLORS[(week - 1) % WEEK_COLORS.length])}>
                Week {week}
              </p>

              <div className="space-y-1">
                {byWeek[week]
                  ?.sort((a, b) => (a.subIndex ?? 0) - (b.subIndex ?? 0))
                  .map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/student/classes/${classId}/lessons/${lesson.id}`}
                      className="block text-sm text-foreground hover:text-primary hover:underline transition-colors py-0.5"
                    >
                      {lesson.title}
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

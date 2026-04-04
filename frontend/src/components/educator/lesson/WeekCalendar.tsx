// filepath: frontend/src/components/educator/lessons/WeekCalendar.tsx

"use client";

import { useState } from "react";
import { Lesson } from "@/types/educator/lesson.types";
import { LessonCard } from "./LessonCard";
import { ChevronDown, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekCalendarProps {
  lessons: Lesson[];
  classId: string;
  totalWeeks: number;
}

export function WeekCalendar({
  lessons,
  classId,
  totalWeeks,
}: WeekCalendarProps): React.JSX.Element {
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([1]));

  function toggleWeek(week: number): void {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  }

  const lessonsByWeek = new Map<number, Lesson[]>();
  for (const lesson of lessons) {
    const existing = lessonsByWeek.get(lesson.weekNumber) ?? [];
    lessonsByWeek.set(lesson.weekNumber, [...existing, lesson]);
  }

  // Show all weeks 1..totalWeeks so educators can see empty weeks too
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      {weeks.map((week) => {
        const weekLessons = lessonsByWeek.get(week) ?? [];
        const isOpen = openWeeks.has(week);

        return (
          <div key={week} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleWeek(week)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors",
                "hover:bg-muted/50",
                isOpen && "bg-muted/30"
              )}
            >
              <span className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                Week {week}
              </span>
              <span className="text-xs text-muted-foreground">
                {weekLessons.length === 0
                  ? "No lessons"
                  : `${weekLessons.length} lesson${weekLessons.length > 1 ? "s" : ""}`}
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 pt-1 space-y-2 border-t bg-background">
                {weekLessons.length === 0 ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground justify-center">
                    <CalendarDays className="h-4 w-4" />
                    No lessons for this week yet.
                  </div>
                ) : (
                  weekLessons.map((lesson) => (
                    <LessonCard
                      key={lesson.id}
                      lesson={lesson}
                      classId={classId}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
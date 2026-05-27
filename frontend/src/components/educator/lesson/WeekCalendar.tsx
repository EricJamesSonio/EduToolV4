"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";

type Lesson = {
  id: string;
  title: string;
  weekNumber: number;   // ✅ fixed
  subIndex: number;     // ✅ fixed
};

type WeekSlot = {
  label: string;

  value: number;
  globalWeek: number;

  termWeek: number;
  semesterWeek: number;

  termName: string;
  semesterName: string;
  semesterIndex: number;

  date: string;
};

interface Props {
  lessons: Lesson[];
  classId: string;
  totalWeeks: number;
  weeks: WeekSlot[];
}

export function WeekCalendar({
  lessons,
  classId,
  weeks,
}: Props) {
  // ✅ group lessons by global week (FIXED)
  const lessonMap = useMemo(() => {
    const map = new Map<number, Lesson[]>();

    for (const lesson of lessons) {
      if (!map.has(lesson.weekNumber)) {
        map.set(lesson.weekNumber, []);
      }
      map.get(lesson.weekNumber)!.push(lesson);
    }

    return map;
  }, [lessons]);

  // group weeks by semester -> term
  const grouped = useMemo(() => {
    const semMap = new Map<
      string,
      {
        semesterName: string;
        terms: Map<
          string,
          {
            termName: string;
            weeks: WeekSlot[];
          }
        >;
      }
    >();

    for (const week of weeks) {
      if (!semMap.has(week.semesterName)) {
        semMap.set(week.semesterName, {
          semesterName: week.semesterName,
          terms: new Map(),
        });
      }

      const sem = semMap.get(week.semesterName)!;

      if (!sem.terms.has(week.termName)) {
        sem.terms.set(week.termName, {
          termName: week.termName,
          weeks: [],
        });
      }

      sem.terms.get(week.termName)!.weeks.push(week);
    }

    return Array.from(semMap.values());
  }, [weeks]);

  return (
    <div className="space-y-8">
      {grouped.map((semester, semIndex) => (
        <div
          key={`${semester.semesterName}-${semIndex}`}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">
            {semester.semesterName}
          </h2>

          {Array.from(semester.terms.values()).map((term) => (
            <div
              key={`${semester.semesterName}-${term.termName}`}
              className="space-y-3"
            >
              <h3 className="text-sm font-medium text-muted-foreground">
                {term.termName}
              </h3>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {term.weeks.map((week) => {
                  const lessonsForWeek =
                    lessonMap.get(week.globalWeek) ?? [];

                  return (
                    <div
                      key={`${week.semesterIndex}-${week.globalWeek}`}
                      className="rounded-xl border bg-card p-6 space-y-4"
                    >
                      {/* Week Label */}
                      <div className="text-sm font-medium">
                        Week {week.semesterWeek}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(week.date), "MMM dd, yyyy")}
                      </div>

                      {/* Lessons */}
                      <div className="space-y-1">
                        {lessonsForWeek.length > 0 ? (
                          lessonsForWeek.map((lesson) => (
                            <Link
                              key={lesson.id}
                              href={`/educator/classes/${classId}/lessons/${lesson.id}`}
                              className="block text-sm hover:underline"
                            >
                              {lesson.title}
                            </Link>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            No lesson
                          </div>
                        )}
                      </div>

                      {/* Create Lesson */}
                      <Link
                        href={`/educator/classes/${classId}/lessons/new?week=${week.globalWeek}`}
                        className="text-xs text-primary hover:underline"
                      >
                        + Add lesson
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
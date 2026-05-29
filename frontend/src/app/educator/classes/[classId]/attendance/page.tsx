"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { useAttendanceSessions } from "@/hooks/educator/useAttendance";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { PageHeader } from "@/components/shared/PageHeader";
import { WEEK_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { WeekSessions } from "@/api/educator/attendance.api";

export default function AttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: weeks = [], isLoading: weeksLoading } =
    useClassWeeks(classId);

  const { data: rawData, isLoading: attendanceLoading } =
    useAttendanceSessions(classId);

  const isLoading = weeksLoading || attendanceLoading;

  const weekGroups: WeekSessions[] = Array.isArray(rawData) ? rawData : [];

  // Map sessions by global week number
  const sessionMap = useMemo(() => {
    const map = new Map<number, WeekSessions["sessions"]>();
    for (const g of weekGroups) {
      map.set(g.week_number, g.sessions);
    }
    return map;
  }, [weekGroups]);

  // Group weeks by semester → term (same as WeekCalendar in lessons)
  const grouped = useMemo(() => {
    const semMap = new Map<
      string,
      {
        semesterName: string;
        terms: Map<
          string,
          {
            termName: string;
            weeks: typeof weeks;
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
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Synced with lesson calendar"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sessions...
        </div>
      ) : (
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
                      const sessions =
                        sessionMap.get(week.globalWeek) ?? [];

                      return (
                        <div
                          key={`${week.semesterIndex}-${week.globalWeek}`}
                          className="rounded-xl border bg-card p-6 space-y-4"
                        >
                          {/* Week label with colored icon */}
                          <div className="flex items-start gap-3">
                            <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[(week.globalWeek - 1) % WEEK_COLORS.length])}>
                              <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                Week {week.semesterWeek}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(week.date), "MMM dd, yyyy")}
                              </p>
                            </div>
                          </div>

                          {/* Sessions */}
                          {sessions.length > 0 ? (
                            <div className="space-y-2">
                              {sessions.map((session) => {
                                const sessionDate = new Date(session.date);
                                const isPast = sessionDate <= new Date();

                                return (
                                  <button
                                    key={session.id}
                                    onClick={() =>
                                      router.push(
                                        `/educator/classes/${classId}/attendance/${session.id}`
                                      )
                                    }
                                    className="w-full flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
                                  >
                                    <div className="flex flex-col items-center justify-center rounded-md border bg-background w-10 h-10 shrink-0">
                                      <span className="text-[9px] font-bold uppercase text-muted-foreground">
                                        {format(sessionDate, "MMM")}
                                      </span>
                                      <span className="text-sm font-bold">
                                        {format(sessionDate, "d")}
                                      </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium">
                                        Session {session.week_number}.{session.sub_index}
                                      </p>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                        <span className="text-[10px] text-muted-foreground truncate">
                                          {format(sessionDate, "EEEE · MMM dd, yyyy")}
                                        </span>
                                      </div>
                                    </div>

                                    <span className={`text-[10px] font-medium ${isPast ? "text-emerald-600" : "text-muted-foreground"}`}>
                                      {isPast ? "Mark" : "Upcoming"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No sessions
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
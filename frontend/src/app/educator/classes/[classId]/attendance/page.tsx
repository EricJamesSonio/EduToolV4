// filepath: frontend/src/app/educator/classes/[classId]/attendance/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useAttendanceSessions } from "@/hooks/educator/useAttendance";
import { Button } from "@/components/ui/button";
import type { WeekSessions } from "@/api/educator/attendance.api";

const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatSessionDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    weekday: WEEKDAY_FULL[d.getDay()],
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };
}

export default function AttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState<number>(1);

  const { data: rawData, isLoading } = useAttendanceSessions(classId);

  const weekGroups: WeekSessions[] = Array.isArray(rawData) ? rawData : [];
  const maxWeek = weekGroups.length
    ? Math.max(...weekGroups.map((w) => w.week_number))
    : 1;

  useEffect(() => {
    if (weekGroups.length > 0) {
      setCurrentWeek(weekGroups[0].week_number);
    }
  }, [weekGroups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentGroup = weekGroups.find((w) => w.week_number === currentWeek);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage session records by week</p>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between rounded-lg border px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
          disabled={currentWeek <= 1}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Current</p>
          <p className="text-lg font-bold mt-0.5">
            Week {currentWeek}
            <span className="text-sm text-muted-foreground font-normal ml-2">of {maxWeek}</span>
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek((w) => Math.min(maxWeek, w + 1))}
          disabled={currentWeek >= maxWeek}
          className="gap-1.5"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Session List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sessions...
        </div>
      ) : !currentGroup || currentGroup.sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <CalendarDays className="h-8 w-8 opacity-40" />
          <p className="text-sm">No sessions found for Week {currentWeek}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentGroup.sessions.map((session, idx) => {
            const { weekday, date } = formatSessionDate(session.date);
            const label = `Session ${session.weekNumber ?? currentWeek}.${session.sessionNumber ?? idx + 1}`;

            return (
              <button
                key={session.id}
                onClick={() =>
                  router.push(`/educator/classes/${classId}/attendance/${session.id}`)
                }
                className="w-full flex items-center justify-between rounded-lg border px-4 py-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-muted w-12 h-12 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {new Date(session.date).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(session.date).getDate()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{weekday} · {date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    View / Edit
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
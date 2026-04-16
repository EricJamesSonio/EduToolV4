"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useAttendanceSessions } from "@/hooks/educator/useAttendance";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks"; // ✅ SAME SOURCE AS LESSONS
import { Button } from "@/components/ui/button";

import type { WeekSessions } from "@/api/educator/attendance.api";

function formatSessionDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export default function AttendancePage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [currentWeek, setCurrentWeek] = useState<number>(1);

  // ✅ SAME SOURCE OF TRUTH AS LESSONS
  const { data: weeks = [], isLoading: weeksLoading } =
    useClassWeeks(classId);

  const { data: rawData, isLoading: attendanceLoading } =
    useAttendanceSessions(classId);

  const isLoading = weeksLoading || attendanceLoading;

  const weekGroups: WeekSessions[] = Array.isArray(rawData) ? rawData : [];

  // ✅ map attendance by week
  const attendanceMap = new Map<number, WeekSessions>();
  for (const w of weekGroups) {
    attendanceMap.set(w.week_number, w);
  }

  // ✅ canonical weeks (FROM LESSON SYSTEM)
  const totalWeeks =
    weeks.length > 0 ? Math.max(...weeks.map((w) => w.value)) : 1;

  useEffect(() => {
    if (weeks.length > 0) {
      setCurrentWeek(weeks[0].value);
    }
  }, [weeks]);

  const currentWeekMeta = weeks.find((w) => w.value === currentWeek);
  const currentGroup = attendanceMap.get(currentWeek);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Synced with lesson calendar
        </p>
      </div>

      {/* Week Navigator (NOW 100% MATCHES LESSON SYSTEM) */}
      <div className="flex items-center justify-between rounded-lg border px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
          disabled={currentWeek <= 1}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            {currentWeekMeta?.semesterName ?? "Semester"}
          </p>

          <p className="text-lg font-bold mt-0.5">
            Week {currentWeek}
            <span className="text-sm text-muted-foreground font-normal ml-2">
              of {totalWeeks}
            </span>
          </p>

          <p className="text-xs text-muted-foreground">
            {currentWeekMeta?.termName}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setCurrentWeek((w) => Math.min(totalWeeks, w + 1))
          }
          disabled={currentWeek >= totalWeeks}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sessions...
        </div>
      ) : !currentGroup || currentGroup.sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <CalendarDays className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No attendance sessions for Week {currentWeek}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentGroup.sessions.map((session) => {
            const { weekday, date } = formatSessionDate(session.date);

            return (
              <button
                key={session.id}
                onClick={() =>
                  router.push(
                    `/educator/classes/${classId}/attendance/${session.id}`
                  )
                }
                className="w-full flex items-center justify-between rounded-lg border px-4 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center rounded-lg border bg-muted w-12 h-12">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      {new Date(session.date).toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-lg font-bold">
                      {new Date(session.date).getDate()}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Session {session.week_number}.{session.sub_index}
                    </p>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {weekday} · {date}
                      </span>
                    </div>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
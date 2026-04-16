"use client";

import { useState, useEffect, useMemo } from "react";
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
import { useLessonWeekStructure } from "@/hooks/educator/useLessons"; // ✅ NEW
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

  // 📌 source 1: attendance sessions
  const { data: rawData, isLoading } = useAttendanceSessions(classId);

  // 📌 source 2: canonical lesson calendar
  const { data: weekStructure } = useLessonWeekStructure(classId);

  const weekGroups: WeekSessions[] = Array.isArray(rawData) ? rawData : [];

  // ✅ flatten attendance by week
  const attendanceMap = useMemo(() => {
    const map = new Map<number, WeekSessions>();
    for (const w of weekGroups) {
      map.set(w.week_number, w);
    }
    return map;
  }, [weekGroups]);

  // ✅ canonical weeks (LESSONS are source of truth)
  const weeks = Array.isArray(weekStructure) ? weekStructure : [];

  const maxWeek = weeks.length;

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
        <p className="text-sm text-muted-foreground mt-0.5">
          Synced with lesson calendar
        </p>
      </div>

      {/* Week Navigator (NOW LESSON-BASED) */}
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
              of {maxWeek}
            </span>
          </p>

          <p className="text-xs text-muted-foreground">
            {currentWeekMeta?.termName}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentWeek((w) => Math.min(maxWeek, w + 1))}
          disabled={currentWeek >= maxWeek}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Sessions */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sessions...
        </div>
      ) : !currentGroup || currentGroup.sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <CalendarDays className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No sessions found for Week {currentWeek}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentGroup.sessions.map((session, idx) => {
            const { weekday, date } = formatSessionDate(session.date);

            const label = `Session ${session.week_number}.${session.sub_index}`;

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
                    <p className="text-sm font-semibold">{label}</p>
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
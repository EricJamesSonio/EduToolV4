"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { useAttendanceSessions } from "@/hooks/educator/useAttendance";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
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

  // Normalize: API returns WeekSessions[] but defensively guard against
  // any unexpected shape (object, undefined, etc.) during loading transitions
  const weekGroups: WeekSessions[] = Array.isArray(rawData) ? rawData : [];

  const maxWeek = weekGroups.length
    ? Math.max(...weekGroups.map((w) => w.week_number))
    : 1;

  // Jump to first available week once data loads
  useEffect(() => {
    if (weekGroups.length > 0) {
      setCurrentWeek(weekGroups[0].week_number);
    }
  }, [weekGroups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentGroup = weekGroups.find((w) => w.week_number === currentWeek);

  const handlePrev = () => setCurrentWeek((w) => Math.max(1, w - 1));
  const handleNext = () => setCurrentWeek((w) => Math.min(maxWeek, w + 1));

  return (
    <div className="min-h-screen bg-[#0f0f11]">
      <div className="h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-violet-400">
              Educator Portal
            </p>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Attendance</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage session records by week</p>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center justify-between mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-4">
          <button
            onClick={handlePrev}
            disabled={currentWeek <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Current</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl font-bold text-white">Week {currentWeek}</span>
              <span className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium">
                of {maxWeek}
              </span>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentWeek >= maxWeek}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Session List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner />
          </div>
        ) : !currentGroup || currentGroup.sessions.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No sessions found for Week {currentWeek}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentGroup.sessions.map((session, idx) => {
              const { weekday, date } = formatSessionDate(session.date);
              const label = `Session ${session.weekNumber ?? currentWeek}.${session.sessionNumber ?? idx + 1}`;

              return (
                <button
                  key={session.id}
                  onClick={() =>
                    router.push(`/educator/classes/${classId}/attendance/${session.id}`)
                  }
                  className="w-full group flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-violet-500/40 rounded-2xl px-6 py-5 transition-all duration-200"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                        {new Date(session.date).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-white leading-none">
                        {new Date(session.date).getDate()}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs text-zinc-500">{weekday} · {date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-500 group-hover:text-violet-400 transition-colors">
                      View / Edit
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 group-hover:bg-violet-500/20 border border-zinc-700 group-hover:border-violet-500/40 flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date.util";
import { useStudentAttendance } from "@/hooks/student/useAttendance";
import type {
  AttendanceSessionEntry,
  AttendanceSummary,
} from "@/api/student/attendance.api";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record
  string,
  { label: string; className: string }
> = {
  present:    { label: "Present",    className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  absent:     { label: "Absent",     className: "bg-red-50    text-red-600    border-red-200"      },
  late:       { label: "Late",       className: "bg-amber-50  text-amber-700  border-amber-200"    },
  excused:    { label: "Excused",    className: "bg-blue-50   text-blue-700   border-blue-200"     },
  unrecorded: { label: "—",          className: "bg-muted     text-muted-foreground border-border/40" },
};

function StatusBadge({ status }: { status: string | null }) {
  const key = status ?? "unrecorded";
  const meta = STATUS_META[key] ?? STATUS_META["unrecorded"];
  return (
    <Badge
      variant="outline"
      className={cn("text-[11px] font-medium shrink-0", meta.className)}
    >
      {meta.label}
    </Badge>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: AttendanceSummary }) {
  const stats = [
    { label: "Present",    value: summary.present,    color: "text-emerald-600" },
    { label: "Absent",     value: summary.absent,     color: "text-red-500"     },
    { label: "Late",       value: summary.late,       color: "text-amber-600"   },
    { label: "Excused",    value: summary.excused,    color: "text-blue-600"    },
    { label: "Unrecorded", value: summary.unrecorded, color: "text-muted-foreground" },
  ];

  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-border/60 bg-card px-5 py-4">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={cn("text-lg font-bold tabular-nums", s.color)}>
            {s.value}
          </span>
          <span className="text-xs text-muted-foreground">{s.label}</span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-lg font-bold tabular-nums text-foreground">
          {summary.total}
        </span>
        <span className="text-xs text-muted-foreground">Total Sessions</span>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function AttendanceTable({ sessions }: { sessions: AttendanceSessionEntry[] }) {
  // Group by week
  const byWeek = sessions.reduce<Record<number, AttendanceSessionEntry[]>>(
    (acc, s) => {
      if (!acc[s.weekNumber]) acc[s.weekNumber] = [];
      acc[s.weekNumber].push(s);
      return acc;
    },
    {}
  );

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/40">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20">
              Week
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">
              Session
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) =>
            byWeek[week]
              ?.sort((a, b) => (a.subIndex ?? 0) - (b.subIndex ?? 0))
              .map((session, i) => (
                <tr
                  key={session.sessionId}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    i === 0 && "border-t border-border/60"
                  )}
                >
                  {/* Week cell — only show on first row of week */}
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    {i === 0 ? `Week ${week}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {session.subIndex ?? i + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {formatDate(session.date)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StatusBadge status={session.status} />
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <div className="bg-muted/40 px-4 py-2.5 flex gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-8 px-4 py-3 border-t border-border/40">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-16 ml-auto rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentAttendancePage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: rawData, isLoading } = useStudentAttendance(classId);

  // Unwrap envelope defensively
  const payload =
    rawData && typeof rawData === "object" && "summary" in rawData
      ? rawData
      : (((rawData as unknown) as Record<string, unknown>)
          ?.data as typeof rawData | undefined);

  const summary = payload?.summary;
  const sessions = payload?.sessions ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="My Attendance" />

      {/* Summary bar */}
      {isLoading ? (
        <div className="flex gap-6 rounded-lg border border-border/60 bg-card px-5 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-5 w-20" />
          ))}
        </div>
      ) : summary ? (
        <SummaryBar summary={summary} />
      ) : null}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No attendance records yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Records will appear here once your educator starts taking attendance
          </p>
        </div>
      ) : (
        <AttendanceTable sessions={sessions} />
      )}
    </div>
  );
}
// src/components/educator/meeting-room/AttendanceSummaryPanel.tsx
"use client";

import { cn } from "@/lib/utils";
import type { AttendanceRecord } from "@/hooks/meeting/useMeetingAttendance";

interface AttendanceSummaryPanelProps {
  records:        AttendanceRecord[];
  formatDuration: (seconds: number) => string;
}

function RoleBadge({ role }: { role: string }) {
  const isEducator = role === "educator";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-semibold capitalize tracking-wide",
        isEducator ? "border-info/30 bg-info/15 text-info" : "border-success/30 bg-success/15 text-success",
      )}
    >
      {role}
    </span>
  );
}

function SessionList({ record, formatDuration }: {
  record: AttendanceRecord;
  formatDuration: (s: number) => string;
}) {
  if (record.sessions.length <= 1) return null;

  return (
    <div className="mt-1.5 pl-9">
      {record.sessions.map((s, i) => {
        const elapsed = s.leftAt > 0
          ? Math.round((s.leftAt - s.joinedAt) / 1000)
          : Math.round((Date.now() - s.joinedAt) / 1000);

        return (
          <div
            key={i}
            className="flex items-center gap-1.5 mb-0.5"
          >
            <span className="text-muted-foreground/40 text-[10px]">↳</span>
            <span className="text-[11px] text-muted-foreground">
              Session {i + 1}: {formatDuration(elapsed)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AttendanceSummaryPanel({
  records,
  formatDuration,
}: AttendanceSummaryPanelProps) {
  // Sort: educators first, then by total time descending
  const sorted = [...records].sort((a, b) => {
    if (a.role !== b.role) return a.role === "educator" ? -1 : 1;
    return b.totalSeconds - a.totalSeconds;
  });

  const totalParticipants = records.length;
  const avgSeconds = totalParticipants > 0
    ? Math.round(records.reduce((sum, r) => sum + r.totalSeconds, 0) / totalParticipants)
    : 0;

  return (
    <div className="flex flex-col h-full">

      {/* ── Header stats ── */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
        <StatCard label="Total Joined" value={String(totalParticipants)} />
        <StatCard label="Avg. Duration" value={formatDuration(avgSeconds)} />
      </div>

      {/* ── Record list ── */}
      <div className="flex-1 overflow-y-auto p-2">
        {sorted.length === 0 && (
          <p className="text-center text-[13px] text-muted-foreground pt-6">
            No attendance data yet
          </p>
        )}

        {sorted.map((record) => (
          <div
            key={record.userId}
            className="rounded-[10px] p-2.5 mb-1 bg-muted/40 border border-border/60"
          >
            {/* Row: avatar + name + role + duration */}
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {record.name[0]?.toUpperCase()}
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-semibold text-foreground truncate max-w-[120px]">
                    {record.name}
                  </span>
                  <RoleBadge role={record.role} />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {record.sessions.length} session{record.sessions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Total duration */}
              <div className="text-right shrink-0">
                <span className={cn(
                  "text-[13px] font-bold",
                  record.totalSeconds >= 60 ? "text-success" : "text-muted-foreground",
                )}>
                  {formatDuration(record.totalSeconds)}
                </span>
              </div>
            </div>

            {/* Per-session breakdown (only if rejoined) */}
            <SessionList record={record} formatDuration={formatDuration} />
          </div>
        ))}
      </div>

      {/* ── Footer note ── */}
      <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground text-center">
        Tracked locally · resets when you close the tab
      </div>
    </div>
  );
}

// ── Tiny stat card ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border/60 p-2 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
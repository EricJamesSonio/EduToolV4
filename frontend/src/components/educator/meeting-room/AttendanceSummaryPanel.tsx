// src/components/educator/meeting-room/AttendanceSummaryPanel.tsx
"use client";

import type { AttendanceRecord } from "@/hooks/meeting/useMeetingAttendance";

interface AttendanceSummaryPanelProps {
  records:        AttendanceRecord[];
  formatDuration: (seconds: number) => string;
}

function RoleBadge({ role }: { role: string }) {
  const isEducator = role === "educator";
  return (
    <span
      style={{
        fontSize:     "10px",
        fontWeight:   600,
        padding:      "1px 7px",
        borderRadius: "999px",
        background:   isEducator ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
        color:        isEducator ? "#a5b4fc"                : "#86efac",
        border:       isEducator ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(34,197,94,0.25)",
        textTransform: "capitalize" as const,
        letterSpacing: "0.03em",
      }}
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
    <div style={{ marginTop: "6px", paddingLeft: "36px" }}>
      {record.sessions.map((s, i) => {
        const elapsed = s.leftAt > 0
          ? Math.round((s.leftAt - s.joinedAt) / 1000)
          : Math.round((Date.now() - s.joinedAt) / 1000);

        return (
          <div
            key={i}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "6px",
              marginBottom: "2px",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>↳</span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── Header stats ── */}
      <div
        style={{
          display:       "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:           "8px",
          padding:       "12px",
          borderBottom:  "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <StatCard label="Total Joined" value={String(totalParticipants)} />
        <StatCard label="Avg. Duration" value={formatDuration(avgSeconds)} />
      </div>

      {/* ── Record list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {sorted.length === 0 && (
          <p style={{
            textAlign: "center",
            fontSize:  "13px",
            color:     "rgba(255,255,255,0.3)",
            paddingTop: "24px",
          }}>
            No attendance data yet
          </p>
        )}

        {sorted.map((record) => (
          <div
            key={record.userId}
            style={{
              borderRadius: "10px",
              padding:      "10px 12px",
              marginBottom: "4px",
              background:   "rgba(255,255,255,0.03)",
              border:       "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Row: avatar + name + role + duration */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Avatar */}
              <div style={{
                width:          "28px",
                height:         "28px",
                borderRadius:   "50%",
                background:     "rgba(99,102,241,0.2)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       "12px",
                fontWeight:     700,
                color:          "#a5b4fc",
                flexShrink:     0,
              }}>
                {record.name[0]?.toUpperCase()}
              </div>

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize:   "13px",
                    fontWeight: 600,
                    color:      "rgba(255,255,255,0.9)",
                    overflow:   "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth:   "120px",
                  }}>
                    {record.name}
                  </span>
                  <RoleBadge role={record.role} />
                </div>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                  {record.sessions.length} session{record.sessions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Total duration */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{
                  fontSize:   "13px",
                  fontWeight: 700,
                  color:      record.totalSeconds >= 60 ? "#86efac" : "rgba(255,255,255,0.5)",
                }}>
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
      <div style={{
        padding:      "8px 12px",
        borderTop:    "1px solid rgba(255,255,255,0.07)",
        fontSize:     "11px",
        color:        "rgba(255,255,255,0.25)",
        textAlign:    "center",
      }}>
        Tracked locally · resets when you close the tab
      </div>
    </div>
  );
}

// ── Tiny stat card ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      borderRadius: "8px",
      background:   "rgba(255,255,255,0.04)",
      border:       "1px solid rgba(255,255,255,0.07)",
      padding:      "8px 10px",
      textAlign:    "center",
    }}>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
        {value}
      </div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
        {label}
      </div>
    </div>
  );
}
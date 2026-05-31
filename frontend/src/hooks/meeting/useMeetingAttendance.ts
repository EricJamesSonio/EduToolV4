// src/hooks/meeting/useMeetingAttendance.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MeetingParticipant } from "@/types/meeting/socket.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttendanceSession {
  joinedAt: number;   // epoch ms
  leftAt:   number;   // epoch ms, 0 = still active
}

export interface AttendanceRecord {
  userId:       string;
  name:         string;
  role:         "educator" | "student";
  totalSeconds: number;
  sessions:     AttendanceSession[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseMeetingAttendanceReturn {
  records:       AttendanceRecord[];
  formatDuration: (seconds: number) => string;
  /** Call when the meeting ends to flush all still-active sessions */
  flushSessions: () => void;
}

/**
 * Tracks how long each participant was present.
 * Diffs the participants array on every update — no server involvement needed.
 * Accumulates totalSeconds across rejoins (join 2min + rejoin 3min = 5min).
 */
export function useMeetingAttendance(
  participants: MeetingParticipant[],
): UseMeetingAttendanceReturn {
  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(new Map());

  // Track who is currently active: userId → joinedAt timestamp
  const activeSessionsRef = useRef<Map<string, number>>(new Map());
  // Track the previous participant list for diffing
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const now     = Date.now();
    const prevIds = prevIdsRef.current;
    const currIds = new Set(participants.map((p) => p.userId));

    // ── Detect new joins ──────────────────────────────────────────────────
    for (const p of participants) {
      if (prevIds.has(p.userId)) continue; // was already here

      activeSessionsRef.current.set(p.userId, now);

      setRecords((prev) => {
        const next = new Map(prev);
        const existing = next.get(p.userId);

        if (existing) {
          // Rejoin — open a new session on the existing record
          next.set(p.userId, {
            ...existing,
            sessions: [...existing.sessions, { joinedAt: now, leftAt: 0 }],
          });
        } else {
          // First join ever
          next.set(p.userId, {
            userId:       p.userId,
            name:         p.name,
            role:         p.role,
            totalSeconds: 0,
            sessions:     [{ joinedAt: now, leftAt: 0 }],
          });
        }
        return next;
      });
    }

    // ── Detect leaves ─────────────────────────────────────────────────────
    for (const prevId of prevIds) {
      if (currIds.has(prevId)) continue; // still here

      const joinedAt = activeSessionsRef.current.get(prevId);
      if (joinedAt === undefined) continue;

      const elapsed = Math.round((now - joinedAt) / 1000);
      activeSessionsRef.current.delete(prevId);

      setRecords((prev) => {
        const next    = new Map(prev);
        const record  = next.get(prevId);
        if (!record) return prev;

        // Close the open session and add elapsed to total
        const updatedSessions = record.sessions.map((s) =>
          s.leftAt === 0 ? { ...s, leftAt: now } : s,
        );

        next.set(prevId, {
          ...record,
          totalSeconds: record.totalSeconds + elapsed,
          sessions:     updatedSessions,
        });
        return next;
      });
    }

    prevIdsRef.current = currIds;
  }, [participants]);

  // Flush any still-active sessions (call this when meeting ends)
  const flushSessions = useCallback(() => {
    const now = Date.now();

    setRecords((prev) => {
      const next = new Map(prev);

      for (const [userId, joinedAt] of activeSessionsRef.current) {
        const record = next.get(userId);
        if (!record) continue;

        const elapsed = Math.round((now - joinedAt) / 1000);
        const updatedSessions = record.sessions.map((s) =>
          s.leftAt === 0 ? { ...s, leftAt: now } : s,
        );

        next.set(userId, {
          ...record,
          totalSeconds: record.totalSeconds + elapsed,
          sessions:     updatedSessions,
        });
      }

      activeSessionsRef.current.clear();
      return next;
    });
  }, []);

  return {
    records: Array.from(records.values()),
    formatDuration,
    flushSessions,
  };
}
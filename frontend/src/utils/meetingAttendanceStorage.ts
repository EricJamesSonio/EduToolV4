// src/utils/meetingAttendanceStorage.ts
// Persists attendance records to localStorage keyed by meetingId.
// No DB needed — survives page refresh/tab close, educator-browser-local only.

import type { AttendanceRecord } from "@/hooks/meeting/useMeetingAttendance";

const KEY_PREFIX = "meeting_attendance_";

export interface SavedAttendance {
  meetingId:   string;
  savedAt:     number;   // epoch ms
  records:     AttendanceRecord[];
}

function storageKey(meetingId: string): string {
  return `${KEY_PREFIX}${meetingId}`;
}

export function saveAttendance(meetingId: string, records: AttendanceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SavedAttendance = {
      meetingId,
      savedAt: Date.now(),
      records,
    };
    localStorage.setItem(storageKey(meetingId), JSON.stringify(payload));
  } catch {
    // localStorage quota exceeded or unavailable — fail silently
  }
}

export function loadAttendance(meetingId: string): SavedAttendance | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(meetingId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedAttendance;
  } catch {
    return null;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}
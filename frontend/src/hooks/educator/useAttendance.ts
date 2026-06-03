// ===== File: frontend/src/hooks/educator/useAttendance.ts =====

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  attendanceApi,
  AttendanceRecordInput,
} from "@/api/educator/attendance.api";

import type {
  WeekSessions,
  SessionWithRecords,
  AttendanceRecord
} from "@/types/educator/attendance.types";

// ======================================================
// QUERY KEYS (IMPORTANT: structured for invalidation)
// ======================================================
const ATTENDANCE_KEY = "attendance";

const attendanceKeys = {
  all: [ATTENDANCE_KEY] as const,
  class: (classId: string) => [ATTENDANCE_KEY, classId] as const,
  weeks: (classId: string, weekNumber?: number) =>
    [ATTENDANCE_KEY, classId, "weeks", weekNumber ?? "all"] as const,
  session: (classId: string, sessionId: string) =>
    [ATTENDANCE_KEY, classId, "session", sessionId] as const,
};

// ======================================================
// GET ATTENDANCE GRID (Excel-like)
// ======================================================
export const useAttendanceGrid = (classId: string) => {
  return useQuery({
    queryKey: attendanceKeys.class(classId),
    queryFn: () => attendanceApi.getAttendanceGrid(classId),
    enabled: !!classId,
  });
};

// ======================================================
// SAVE ALL DIRTY CELLS (one bulkSet per session)
// ======================================================
export const useSaveAttendanceGrid = (classId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      batches: { sessionId: string; records: AttendanceRecordInput[] }[],
    ) =>
      Promise.all(
        batches.map((b) =>
          attendanceApi.bulkSet(classId, b.sessionId, b.records),
        ),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.class(classId) });
    },
  });
};

// ======================================================
// GET WEEKLY SESSIONS
// ======================================================
export const useAttendanceSessions = (
  classId: string,
  weekNumber?: number
) => {
  return useQuery<WeekSessions[]>({
    queryKey: attendanceKeys.weeks(classId, weekNumber),
    queryFn: () => attendanceApi.getSessions(classId, weekNumber),
    enabled: !!classId,
  });
};

// ======================================================
// GET SINGLE SESSION (WITH RECORDS)
// ======================================================
export const useAttendanceSession = (
  classId: string,
  sessionId: string
) => {
  return useQuery<SessionWithRecords>({
    queryKey: attendanceKeys.session(classId, sessionId),
    queryFn: () => attendanceApi.getSession(classId, sessionId),
    enabled: !!classId && !!sessionId,
  });
};

// ======================================================
// BULK SET ATTENDANCE
// ======================================================
export const useBulkSetAttendance = (
  classId: string,
  sessionId: string
) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (records: AttendanceRecordInput[]) =>
      attendanceApi.bulkSet(classId, sessionId, records),

    onSuccess: () => {
      // 🔥 invalidate EVERYTHING related to attendance for this class
      qc.invalidateQueries({
        queryKey: attendanceKeys.class(classId),
      });
    },
  });
};

// ======================================================
// UPDATE SINGLE RECORD
// ======================================================
export const useUpdateAttendanceRecord = (
  classId: string,
  sessionId: string
) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordId,
      status,
    }: {
      recordId: string;
      status: "present" | "absent" | "late" | "excused";
    }) =>
      attendanceApi.updateRecord(
        classId,
        sessionId,
        recordId,
        status
      ),

    onSuccess: () => {
      // 🔥 refresh BOTH list + session detail
      qc.invalidateQueries({
        queryKey: attendanceKeys.class(classId),
      });

      qc.invalidateQueries({
        queryKey: attendanceKeys.session(classId, sessionId),
      });
    },
  });
};
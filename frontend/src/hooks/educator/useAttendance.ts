// src/hooks/educator/useAttendance.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, AttendanceRecordInput } from "@/api/educator/attendance.api";

const ATTENDANCE_KEY = "attendance";

export const useAttendanceSessions = (classId: string, weekNumber?: number) => {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, classId, weekNumber],
    queryFn: () =>
      attendanceApi.getSessions(classId, weekNumber),
    enabled: !!classId,
  });
};

export const useAttendanceSession = (classId: string, sessionId: string) => {
  return useQuery({
    queryKey: [ATTENDANCE_KEY, classId, sessionId],
    queryFn: () =>
      attendanceApi.getSession(classId, sessionId),
    enabled: !!classId && !!sessionId,
  });
};

export const useBulkSetAttendance = (classId: string, sessionId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (records: AttendanceRecordInput[]) =>
      attendanceApi.bulkSet(classId, sessionId, records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ATTENDANCE_KEY, classId] });
    },
  });
};

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
      qc.invalidateQueries({ queryKey: [ATTENDANCE_KEY, classId] });
    },
  });
};
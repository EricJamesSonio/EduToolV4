import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  attendanceApi,
  AttendanceRecordInput,
} from "@/api/educator/attendance.api";
import type {
  WeekSessions,
  SessionWithRecords,
} from "@/types/educator/attendance.types";

export const useAttendanceGrid = (classId: string) => {
  return useAsyncQuery(
    queryKeys.educator.attendance.list(classId),
    () => attendanceApi.getAttendanceGrid(classId),
    { enabled: !!classId },
  );
};

export const useSaveAttendanceGrid = (classId: string) => {
  return useMutationWithInvalidation(
    (batches: { sessionId: string; records: AttendanceRecordInput[] }[]) =>
      Promise.all(
        batches.map((b) =>
          attendanceApi.bulkSet(classId, b.sessionId, b.records),
        ),
      ),
    { invalidateKeys: [queryKeys.educator.attendance.list(classId)] },
  );
};

export const useAttendanceSessions = (classId: string, weekNumber?: number) => {
  return useAsyncQuery<WeekSessions[]>(
    weekNumber !== undefined
      ? queryKeys.educator.attendance.weeks(classId, weekNumber)
      : queryKeys.educator.attendance.list(classId),
    () => attendanceApi.getSessions(classId, weekNumber),
    { enabled: !!classId, meta: { preset: 'list' } },
  );
};

export const useAttendanceSession = (classId: string, sessionId: string) => {
  return useAsyncQuery<SessionWithRecords>(
    queryKeys.educator.attendance.session(sessionId),
    () => attendanceApi.getSession(classId, sessionId),
    { enabled: !!classId && !!sessionId },
  );
};

export const useBulkSetAttendance = (classId: string, sessionId: string) => {
  return useMutationWithInvalidation(
    (records: AttendanceRecordInput[]) =>
      attendanceApi.bulkSet(classId, sessionId, records),
    { invalidateKeys: [queryKeys.educator.attendance.list(classId)] },
  );
};

export const useUpdateAttendanceRecord = (classId: string, sessionId: string) => {
  return useMutationWithInvalidation(
    ({ recordId, status }: { recordId: string; status: "present" | "absent" | "late" | "excused" }) =>
      attendanceApi.updateRecord(classId, sessionId, recordId, status),
    {
      invalidateKeys: [
        queryKeys.educator.attendance.list(classId),
        queryKeys.educator.attendance.session(sessionId),
      ],
    },
  );
};

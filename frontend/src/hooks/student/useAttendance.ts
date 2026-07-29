import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentAttendanceApi } from "@/api/student/attendance.api";

export const useStudentAttendance = (classId: string) => {
  return useAsyncQuery(
    queryKeys.student.attendance.list(classId),
    () => studentAttendanceApi.getOwn(classId),
    { enabled: !!classId },
  );
};

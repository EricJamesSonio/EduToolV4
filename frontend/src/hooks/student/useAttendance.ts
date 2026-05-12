import { useQuery } from "@tanstack/react-query";
import { studentAttendanceApi } from "@/api/student/attendance.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useStudentAttendance = (classId: string) => {
  return useQuery({
    queryKey: ["student", "attendance", classId],
    queryFn: () => studentAttendanceApi.getOwn(classId),
    enabled: !!classId,
    ...QUERY_CONFIGS.detail,
  });
};
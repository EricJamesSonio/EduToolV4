import { useQuery } from "@tanstack/react-query";
import { studentAttendanceApi } from "@/api/student/attendance.api";

export const useStudentAttendance = (classId: string) => {
  return useQuery({
    queryKey: ["student", "attendance", classId],
    queryFn: () => studentAttendanceApi.getOwn(classId),
    enabled: !!classId,
  });
};
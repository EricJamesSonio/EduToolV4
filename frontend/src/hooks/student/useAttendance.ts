import { useQuery } from "@tanstack/react-query";
import { studentGradeApi } from "@/api/student/grade.api";

export const useStudentGrades = (classId: string) => {
  return useQuery({
    queryKey: ["student", "grades", classId],
    queryFn: () => studentGradeApi.getOwn(classId),
    enabled: !!classId,
  });
};
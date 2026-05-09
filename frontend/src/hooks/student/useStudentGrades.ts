// frontend/src/hooks/student/useStudentGrades.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { studentGradeApi } from "@/api/student/grade.api";
import type { StudentTermGrade } from "@/api/student/grade.api";
import { gradeKeys } from "@/hooks/queryKeys";

export const useStudentGrades = (
  classId: string
): UseQueryResult<StudentTermGrade[], Error> => {
  return useQuery({
    queryKey: gradeKeys.byClass(classId),
    queryFn: () => studentGradeApi.getOwn(classId),
    enabled: !!classId,
    staleTime: 1000 * 60, // 1 minute for grades (frequently updated)
  });
};
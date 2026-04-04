// frontend/src/hooks/student/useStudentGrades.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { studentGradeApi } from "@/api/student/grade.api";
import type { StudentTermGrade } from "@/api/student/grade.api";

export const useStudentGrades = (
  classId: string
): UseQueryResult<StudentTermGrade[], Error> => {
  return useQuery({
    queryKey: ["student", "grades", classId],
    queryFn: () => studentGradeApi.getOwn(classId),
    enabled: !!classId,
  });
};
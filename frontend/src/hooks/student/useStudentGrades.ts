import { UseQueryResult } from "@tanstack/react-query";
import { studentGradeApi } from "@/api/student/grade.api";
import type { StudentTermGrade } from "@/api/student/grade.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";

export const useStudentGrades = (
  classId: string
): UseQueryResult<StudentTermGrade[], Error> => {
  return useAsyncQuery<StudentTermGrade[]>(
    queryKeys.student.grades.list(classId),
    () => studentGradeApi.getOwn(classId),
    {
      meta: { preset: 'list', feature: 'student-grades' },
      enabled: !!classId,
    },
  );
};
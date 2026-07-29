import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentSemesterApi } from "@/api/student/semester.api";

export function useStudentSemesters() {
  return useAsyncQuery(
    queryKeys.student.semesters.list(),
    studentSemesterApi.getAll,
  );
}

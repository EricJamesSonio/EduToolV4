// frontend/src/hooks/student/useStudentSemesters.ts
import { useQuery } from "@tanstack/react-query";
import { studentSemesterApi } from "@/api/student/semester.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

export function useStudentSemesters() {
  return useQuery({
    queryKey: ["student", "semesters"],
    queryFn: studentSemesterApi.getAll,
    ...QUERY_CONFIGS.list,
  });
}
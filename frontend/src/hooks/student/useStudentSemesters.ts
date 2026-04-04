// frontend/src/hooks/student/useStudentSemesters.ts
import { useQuery } from "@tanstack/react-query";
import { studentSemesterApi } from "@/api/student/semester.api";

export function useStudentSemesters() {
  return useQuery({
    queryKey: ["student", "semesters"],
    queryFn: studentSemesterApi.getAll,
  });
}
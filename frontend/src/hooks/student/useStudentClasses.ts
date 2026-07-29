import { useQuery } from "@tanstack/react-query";
import { studentClassApi } from "@/api/student/class.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useStudentClasses = () => {
  return useQuery({
    queryKey: ["student", "classes"],
    queryFn: studentClassApi.getAll,
    ...QUERY_CONFIGS.list,
  });
};

export const useStudentClass = (classId: string) => {
  return useQuery({
    queryKey: ["student", "class", classId],
    queryFn: () => studentClassApi.getOne(classId),
    enabled: !!classId,
    ...QUERY_CONFIGS.detail,
  });
};
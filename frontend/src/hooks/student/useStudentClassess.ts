import { useQuery } from "@tanstack/react-query";
import { studentClassApi } from "@/api/student/class.api";

export const useStudentClasses = () => {
  return useQuery({
    queryKey: ["student", "classes"],
    queryFn: studentClassApi.getAll,
  });
};

export const useStudentClass = (classId: string) => {
  return useQuery({
    queryKey: ["student", "class", classId],
    queryFn: () => studentClassApi.getOne(classId),
    enabled: !!classId,
  });
};
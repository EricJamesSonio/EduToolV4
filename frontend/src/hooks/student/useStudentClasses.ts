import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentClassApi } from "@/api/student/class.api";

export const useStudentClasses = () => {
  return useAsyncQuery(
    queryKeys.student.classes.list(),
    studentClassApi.getAll,
  );
};

export const useStudentClass = (classId: string) => {
  return useAsyncQuery(
    queryKeys.student.classes.detail(classId),
    () => studentClassApi.getOne(classId),
    { enabled: !!classId },
  );
};

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { studentGradeLockApi } from "@/api/student/grade-lock.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { ClassLockInfo } from "@/api/student/grade-lock.api";

export const useStudentClassGradeLock = (classId: string) => {
  return useAsyncQuery<ClassLockInfo>(
    queryKeys.student.gradeLock.list(classId),
    () => studentGradeLockApi.getClassLockInfo(classId),
    { enabled: !!classId },
  );
}

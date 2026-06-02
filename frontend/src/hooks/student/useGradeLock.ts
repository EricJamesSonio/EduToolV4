import { useQuery } from "@tanstack/react-query"
import { studentGradeLockApi } from "@/api/student/grade-lock.api"
import type { ClassLockInfo } from "@/api/student/grade-lock.api"

export const useStudentClassGradeLock = (classId: string) => {
  return useQuery<ClassLockInfo>({
    queryKey: ["student-grade-lock", classId],
    queryFn: () => studentGradeLockApi.getClassLockInfo(classId),
    enabled: !!classId,
  })
}

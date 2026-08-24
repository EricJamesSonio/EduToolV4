import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { academicHistoryApi } from "@/api/admin/academic-history.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useAcademicTimeline = (studentId: string, schoolYearId?: string, sort: "asc" | "desc" = "asc") => {
  return useAsyncQuery(
    [...queryKeys.admin.students.detail(studentId), "timeline", schoolYearId, sort] as unknown as readonly unknown[],
    () => academicHistoryApi.getTimeline(studentId, { schoolYearId, sort }),
    { enabled: !!studentId },
  );
};

export const useAcademicFullHistory = (studentId: string) => {
  return useAsyncQuery(
    [...queryKeys.admin.students.detail(studentId), "fullHistory"] as unknown as readonly unknown[],
    () => academicHistoryApi.getFullHistory(studentId),
    { enabled: !!studentId },
  );
};

export const useMyAcademicTimeline = (schoolYearId?: string, sort: "asc" | "desc" = "asc") => {
  return useAsyncQuery(
    ["student", "academicHistory", "timeline", schoolYearId, sort] as unknown as readonly unknown[],
    () => academicHistoryApi.getMyTimeline({ schoolYearId, sort }),
  );
};

export const useMyAcademicHistory = () => {
  return useAsyncQuery(
    ["student", "academicHistory", "full"] as unknown as readonly unknown[],
    () => academicHistoryApi.getMyHistory(),
  );
};

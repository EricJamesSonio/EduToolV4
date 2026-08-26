import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useQueryClient } from "@tanstack/react-query";
import { academicHistoryApi } from "@/api/admin/academic-history.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useAcademicTimeline = (studentId: string, schoolYearId?: string, sort: "asc" | "desc" = "asc") => {
  return useAsyncQuery(
    queryKeys.admin.academicHistory.timeline(studentId, { schoolYearId, sort }),
    () => academicHistoryApi.getTimeline(studentId, { schoolYearId, sort }),
    { enabled: !!studentId, meta: { preset: "detail" } },
  );
};

export const useAcademicFullHistory = (studentId: string) => {
  return useAsyncQuery(
    queryKeys.admin.academicHistory.fullHistory(studentId),
    () => academicHistoryApi.getFullHistory(studentId),
    { enabled: !!studentId, meta: { preset: "detail" } },
  );
};

export const useMyAcademicTimeline = (schoolYearId?: string, sort: "asc" | "desc" = "asc") => {
  return useAsyncQuery(
    queryKeys.student.academicHistory.timeline({ schoolYearId, sort }),
    () => academicHistoryApi.getMyTimeline({ schoolYearId, sort }),
    { meta: { preset: "detail" } },
  );
};

export const useMyAcademicHistory = () => {
  return useAsyncQuery(
    queryKeys.student.academicHistory.full(),
    () => academicHistoryApi.getMyHistory(),
    { meta: { preset: "detail" } },
  );
};

export const useInvalidateMyAcademicHistory = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.student.academicHistory.all });
};

export const useInvalidateAcademicHistory = (studentId: string) => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.admin.academicHistory.timeline(studentId) });
    qc.invalidateQueries({ queryKey: queryKeys.admin.academicHistory.fullHistory(studentId) });
    qc.invalidateQueries({ queryKey: queryKeys.admin.students.detail(studentId) });
  };
};

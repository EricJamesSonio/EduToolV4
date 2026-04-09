import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { analyticsApi } from "@/api/admin/analytics.api";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import type { GradeAnalyticsResponse } from "@/api/admin/analytics.api";

export const useAnalyticsOverview = (
  schoolYearId?: string,
): UseQueryResult<AnalyticsOverview, unknown> => {
  return useQuery<AnalyticsOverview>({
    queryKey: ["analytics", "overview", schoolYearId],
    queryFn:  () => analyticsApi.getOverview(schoolYearId),
  });
};

export const useEnrollmentBreakdown = (
  schoolYearId?: string,
): UseQueryResult<EnrollmentBreakdownRow[], unknown> => {
  return useQuery<EnrollmentBreakdownRow[]>({
    queryKey: ["analytics", "enrollment", schoolYearId],
    queryFn:  () => analyticsApi.getEnrollmentBreakdown(schoolYearId),
  });
};

export const useGradeAnalytics = (params?: {
  classId?:     string;
  termId?:      string;
  schoolYearId?: string;
}): UseQueryResult<GradeAnalyticsResponse, unknown> => {
  return useQuery<GradeAnalyticsResponse>({
    queryKey: ["analytics", "grades", params],
    queryFn:  () =>
      analyticsApi.getGradeAnalytics(params?.classId, params?.termId, params?.schoolYearId),
  });
};
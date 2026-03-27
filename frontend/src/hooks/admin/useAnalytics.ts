import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { analyticsApi } from "@/api/admin/analytics.api";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import type { GradeAnalyticsResponse } from "@/api/admin/analytics.api";

// Hook to get the analytics overview
export const useAnalyticsOverview = (): UseQueryResult<AnalyticsOverview, unknown> => {
  return useQuery<AnalyticsOverview>({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });
};

// Hook to get enrollment breakdown
export const useEnrollmentBreakdown = (): UseQueryResult<EnrollmentBreakdownRow[], unknown> => {
  return useQuery<EnrollmentBreakdownRow[]>({
    queryKey: ["analytics", "enrollment"],
    queryFn: analyticsApi.getEnrollmentBreakdown,
  });
};

// Hook to get grade analytics, optionally filtered by class or term
export const useGradeAnalytics = (params?: {
  classId?: string;
  termId?: string;
}): UseQueryResult<GradeAnalyticsResponse, unknown> => {
  return useQuery<GradeAnalyticsResponse>({
    queryKey: ["analytics", "grades", params],
    queryFn: () =>
      analyticsApi.getGradeAnalytics(params?.classId, params?.termId),
  });
};
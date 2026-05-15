import { UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { analyticsApi } from "@/api/admin/analytics.api";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import type { GradeAnalyticsResponse } from "@/api/admin/analytics.api";

export const useAnalyticsOverview = (
  schoolYearId?: string,
): UseQueryResult<AnalyticsOverview, Error> => {
  return useAsyncQuery<AnalyticsOverview>(
    schoolYearId ? queryKeys.admin.analytics.detail(schoolYearId) : queryKeys.admin.analytics.all,
    () => analyticsApi.getOverview(schoolYearId),
    {
      enabled: !!schoolYearId,
    },
  );
};

export const useEnrollmentBreakdown = (
  schoolYearId?: string,
): UseQueryResult<EnrollmentBreakdownRow[], Error> => {
  return useAsyncQuery<EnrollmentBreakdownRow[]>(
    schoolYearId ? [...queryKeys.admin.analytics.all, 'enrollment', schoolYearId] as const : [...queryKeys.admin.analytics.all, 'enrollment'] as const,
    () => analyticsApi.getEnrollmentBreakdown(schoolYearId),
    {
      enabled: !!schoolYearId,
    },
  );
};

export const useGradeAnalytics = (params?: {
  classId?: string;
  termId?: string;
  schoolYearId?: string;
}): UseQueryResult<GradeAnalyticsResponse, Error> => {
  return useAsyncQuery<GradeAnalyticsResponse>(
    [...queryKeys.admin.analytics.all, 'grades', params] as const,
    () => analyticsApi.getGradeAnalytics(params?.classId, params?.termId, params?.schoolYearId),
    {
      enabled: !!(params?.classId || params?.termId || params?.schoolYearId),
    },
  );
};
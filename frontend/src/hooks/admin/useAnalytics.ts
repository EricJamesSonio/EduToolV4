import { UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { analyticsApi, DEFAULT_PAGE_SIZE } from "@/api/admin/analytics.api";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { GradeAnalyticsResponse } from "@/api/admin/analytics.api";

interface QueryGate {
  enabled?: boolean;
}

export const useAnalyticsOverview = (
  schoolYearId?: string,
  options?: QueryGate,
): UseQueryResult<AnalyticsOverview, Error> => {
  return useAsyncQuery<AnalyticsOverview>(
    schoolYearId ? queryKeys.admin.analytics.detail(schoolYearId) : queryKeys.admin.analytics.all,
    () => analyticsApi.getOverview(schoolYearId),
    {
      enabled: !!schoolYearId && (options?.enabled ?? true),
    },
  );
};

export const useEnrollmentBreakdown = (
  schoolYearId?: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
  options?: QueryGate,
): UseQueryResult<PaginatedResponse<EnrollmentBreakdownRow>, Error> => {
  return useAsyncQuery<PaginatedResponse<EnrollmentBreakdownRow>>(
    [
      ...queryKeys.admin.analytics.all,
      'enrollment',
      ...(schoolYearId ? [schoolYearId] : []),
      page,
      limit,
    ] as const,
    () => analyticsApi.getEnrollmentBreakdown(schoolYearId, page, limit),
    {
      enabled: !!schoolYearId && (options?.enabled ?? true),
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
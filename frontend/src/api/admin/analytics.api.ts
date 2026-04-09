import client from "@/api/client";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";

export interface GradeAnalyticsResponse {
  passingRate:  number;
  distribution: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const analyticsApi = {
  getOverview: async (schoolYearId?: string): Promise<AnalyticsOverview> => {
    const res = await client.get<ApiResponse<AnalyticsOverview>>("/analytics/overview", {
      params: { schoolYearId },
    });
    return res.data.data;
  },

  getEnrollmentBreakdown: async (schoolYearId?: string): Promise<EnrollmentBreakdownRow[]> => {
    const res = await client.get<ApiResponse<EnrollmentBreakdownRow[]>>("/analytics/enrollment", {
      params: { schoolYearId },
    });
    return res.data.data;
  },

  getGradeAnalytics: async (
    classId?: string,
    termId?: string,
    schoolYearId?: string,
  ): Promise<GradeAnalyticsResponse> => {
    const res = await client.get<ApiResponse<GradeAnalyticsResponse>>("/analytics/grades", {
      params: { classId, termId, schoolYearId },
    });
    return res.data.data;
  },
};
import client from "@/api/client";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";

export interface GradeAnalyticsResponse {
  passingRate: number;
  distribution: Record<string, number>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await client.get<ApiResponse<AnalyticsOverview>>("/analytics/overview");
    return res.data.data; // ✅ unwrap the envelope
  },

  getEnrollmentBreakdown: async (): Promise<EnrollmentBreakdownRow[]> => {
    const res = await client.get<ApiResponse<EnrollmentBreakdownRow[]>>("/analytics/enrollment");
    return res.data.data; // ✅ unwrap the envelope
  },

  getGradeAnalytics: async (classId?: string, termId?: string): Promise<GradeAnalyticsResponse> => {
    const res = await client.get<ApiResponse<GradeAnalyticsResponse>>("/analytics/grades", {
      params: { classId, termId },
    });
    return res.data.data; // ✅ unwrap the envelope
  },
};
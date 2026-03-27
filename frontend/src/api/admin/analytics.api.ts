import client from "@/api/client";
import type { AnalyticsOverview, EnrollmentBreakdownRow } from "@/types/admin/analytics.types";

export interface GradeAnalyticsResponse {
  passingRate: number;
  distribution: Record<string, number>;
}

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const res = await client.get<AnalyticsOverview>("/analytics/overview");
    return res.data;
  },
  getEnrollmentBreakdown: async (): Promise<EnrollmentBreakdownRow[]> => {
    const res = await client.get<EnrollmentBreakdownRow[]>("/analytics/enrollment");
    return res.data;
  },
  getGradeAnalytics: async (classId?: string, termId?: string): Promise<GradeAnalyticsResponse> => {
    const res = await client.get<GradeAnalyticsResponse>("/analytics/grades", {
      params: { classId, termId },
    });
    return res.data;
  },
};
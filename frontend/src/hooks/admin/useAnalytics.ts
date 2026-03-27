import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/admin/analytics.api";

export const useAnalyticsOverview = () => {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: analyticsApi.getOverview,
  });
};

export const useEnrollmentBreakdown = () => {
  return useQuery({
    queryKey: ["analytics", "enrollment"],
    queryFn: analyticsApi.getEnrollmentBreakdown,
  });
};

export const useGradeAnalytics = (params?: {
  classId?: string;
  termId?: string;
}) => {
  return useQuery({
    queryKey: ["analytics", "grades", params],
    queryFn: () =>
      analyticsApi.getGradeAnalytics(params?.classId, params?.termId),
  });
};
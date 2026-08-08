// src/hooks/admin/useEnrollmentDashboard.ts
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { enrollmentPortalApi } from "@/api/admin/enrollment-portal.api";
import type { EnrollmentPortalDashboard } from "@/types/enrollment-portal.types";

export function useEnrollmentPortalDashboard(periodId?: string) {
  return useAsyncQuery<EnrollmentPortalDashboard, Error>(
    queryKeys.admin.enrollmentPortal.dashboard(periodId),
    () => enrollmentPortalApi.getDashboard(periodId),
  );
}

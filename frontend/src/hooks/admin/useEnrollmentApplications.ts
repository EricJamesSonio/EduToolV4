// src/hooks/admin/useEnrollmentApplications.ts
import { useEffect, useMemo, useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { enrollmentPortalApi, type ApplicationQuery } from "@/api/admin/enrollment-portal.api";
import type { PaginatedApplications, ApplicationDetail } from "@/types/enrollment-portal.types";

export function useEnrollmentApplications(
  query: ApplicationQuery,
): UseQueryResult<PaginatedApplications, Error> {
  const key = useMemo(
    () => queryKeys.admin.enrollmentPortal.applications.list(query),
    [JSON.stringify(query)],
  );
  return useAsyncQuery<PaginatedApplications, Error>(
    key,
    () => enrollmentPortalApi.getApplications(query),
  );
}

export function useApplicationDetail(id: string) {
  return useAsyncQuery<ApplicationDetail, Error>(
    queryKeys.admin.enrollmentPortal.applications.detail(id),
    () => enrollmentPortalApi.getApplication(id),
    { enabled: !!id },
  );
}

export function useApproveApplication() {
  return useMutationWithInvalidation(
    (id: string) => enrollmentPortalApi.approveApplication(id),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.applications.all],
      onSuccess: (data) => {
        toast.success(
          data.section
            ? `Application approved and assigned to ${data.section.name}.`
            : "Application approved (no section with capacity — registrar notified).",
        );
      },
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to approve application."),
    },
  );
}

export function useRejectApplication() {
  return useMutationWithInvalidation(
    ({ id, reason }: { id: string; reason: string }) =>
      enrollmentPortalApi.rejectApplication(id, reason),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.applications.all],
      onSuccess: () => toast.success("Application rejected."),
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to reject application."),
    },
  );
}

export function useUnlockApplication() {
  return useMutationWithInvalidation(
    (input: { personal_email?: string; application_code?: string }) =>
      enrollmentPortalApi.unlockApplication(input),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.applications.all],
      onSuccess: () => toast.success("Application unlocked — the applicant can edit again."),
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to unlock application."),
    },
  );
}

// Localized filter state shared by the applications list page.
export function useApplicationFilters(initialPeriodId = "") {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "pending" | "locked" | "approved" | "rejected">("");
  const [periodId, setPeriodId] = useState(initialPeriodId);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, status, periodId]);

  const query: ApplicationQuery = { page, limit };
  if (status) query.status = status;
  if (periodId) query.period_id = periodId;

  return {
    search,
    setSearch,
    status,
    setStatus,
    periodId,
    setPeriodId,
    page,
    setPage,
    limit,
    setLimit,
    query,
  };
}
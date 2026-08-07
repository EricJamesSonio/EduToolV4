// src/hooks/admin/useEnrollmentPeriods.ts
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { enrollmentPortalApi } from "@/api/admin/enrollment-portal.api";
import type {
  EnrollmentPeriod,
  PeriodListResponse,
  CreateEnrollmentPeriodInput,
} from "@/types/enrollment-portal.types";

export const useEnrollmentPeriods = (): UseQueryResult<PeriodListResponse, Error> => {
  return useAsyncQuery<PeriodListResponse, Error>(
    queryKeys.admin.enrollmentPortal.periods.list(),
    () => enrollmentPortalApi.getPeriods(),
  );
};

export const useCreateEnrollmentPeriod = (): UseMutationResult<
  EnrollmentPeriod,
  Error,
  CreateEnrollmentPeriodInput
> => {
  return useMutationWithInvalidation<EnrollmentPeriod, Error, CreateEnrollmentPeriodInput>(
    (data) => enrollmentPortalApi.createPeriod(data),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.periods.list()],
      onSuccess: () => toast.success("Enrollment period created."),
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to create enrollment period."),
    },
  );
};

export const useUpdateEnrollmentPeriod = (): UseMutationResult<
  EnrollmentPeriod,
  Error,
  { id: string; data: Partial<CreateEnrollmentPeriodInput> }
> => {
  return useMutationWithInvalidation<
    EnrollmentPeriod,
    Error,
    { id: string; data: Partial<CreateEnrollmentPeriodInput> }
  >(
    ({ id, data }) => enrollmentPortalApi.updatePeriod(id, data),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.periods.list()],
      onSuccess: () => toast.success("Enrollment period updated."),
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to update enrollment period."),
    },
  );
};

export const useDeleteEnrollmentPeriod = (): UseMutationResult<
  { success: boolean },
  Error,
  string
> => {
  return useMutationWithInvalidation<{ success: boolean }, Error, string>(
    (id) => enrollmentPortalApi.deletePeriod(id),
    {
      invalidateKeys: [queryKeys.admin.enrollmentPortal.periods.list()],
      onSuccess: () => toast.success("Enrollment period deleted."),
      onError: (err: Error) =>
        toast.error((err as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Failed to delete enrollment period."),
    },
  );
};
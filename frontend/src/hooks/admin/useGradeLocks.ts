import { UseQueryResult, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useAsyncMutation, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { gradeLockApi, BulkAssignError } from "@/api/admin/grade-lock.api";
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
  AutoLockResponse,
  UnlockRequest,
  BulkAssignTotals,
  BulkAssignOptions,
} from "@/types/admin/grade-lock.types";
import { toast } from "sonner";

// Get grade lock settings
export const useGradeLockSettings = (): UseQueryResult<GradeLockSetting[], Error> => {
  return useAsyncQuery<GradeLockSetting[]>(
    queryKeys.admin.gradeLock.list(),
    () => gradeLockApi.getSettings(),
  );
};

// Create grade lock setting
export const useCreateGradeLockSetting = (): UseMutationResult<GradeLockSetting, Error, any> => {
  return useMutationWithInvalidation<GradeLockSetting, Error, any>(
    (data) => gradeLockApi.createSetting(data),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Setting created successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create setting");
      },
    },
  );
};

// Update grade lock setting
export const useUpdateGradeLockSetting = (): UseMutationResult<
  GradeLockSetting,
  Error,
  { id: string; data: any }
> => {
  return useMutationWithInvalidation<GradeLockSetting, Error, { id: string; data: any }>(
    ({ id, data }) => gradeLockApi.updateSetting(id, data),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Setting updated successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update setting");
      },
    },
  );
};

// Get grade locks for school year
export const useGradeLocks = (schoolYearId?: string): UseQueryResult<GradeLock[], Error> => {
  return useAsyncQuery<GradeLock[]>(
    schoolYearId ? [...queryKeys.admin.gradeLock.list({ schoolYearId })] as const : queryKeys.admin.gradeLock.list(),
    () => gradeLockApi.getLocks({ schoolYearId }),
    {
      enabled: !!schoolYearId,
    },
  );
};

// Assign setting to class
export const useAssignSetting = (): UseMutationResult<GradeLock, Error, { classId: string; settingId: string }> => {
  return useMutationWithInvalidation<GradeLock, Error, { classId: string; settingId: string }>(
    ({ classId, settingId }) => gradeLockApi.assignSetting(classId, settingId),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Template applied");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to apply template");
      },
    },
  );
};

// Assign setting to MANY classes.
//
// Deliberately NOT useMutationWithInvalidation: that invalidates in onSuccess
// only, so a run that fails halfway through several chunks would leave the
// table showing stale data. Here the whole chunked run is a single mutation,
// and the cache is invalidated exactly once at the end of it — on success AND
// on partial failure.
export const useAssignSettingBulk = (): UseMutationResult<
  BulkAssignTotals,
  Error,
  { classIds: string[]; settingId: string } & BulkAssignOptions
> => {
  const queryClient = useQueryClient();
  const lockListKey = queryKeys.admin.gradeLock.list();

  return useAsyncMutation<
    BulkAssignTotals,
    Error,
    { classIds: string[]; settingId: string } & BulkAssignOptions
  >(
    ({ classIds, settingId, signal, onProgress }) =>
      gradeLockApi.assignSettingBulk(classIds, settingId, { signal, onProgress }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: lockListKey });

        const skipped =
          data.skippedLocked + data.skippedUnchanged + data.skippedInvalid;

        toast.success(
          skipped > 0
            ? `Template applied to ${data.assigned} of ${data.requested} classes (${skipped} skipped)`
            : `Template applied to ${data.assigned} classes`,
        );
      },
      onError: (error: Error) => {
        const bulk = error as BulkAssignError;

        if (bulk?.cancelled) {
          // User-initiated abort: partial state still needs a refresh.
          queryClient.invalidateQueries({ queryKey: lockListKey });
          toast.warning(
            `Cancelled — template applied to ${bulk.partial.assigned} of ${bulk.partial.requested} classes`,
          );
          return;
        }

        // Even a failed run may have applied whole chunks before the error,
        // so refresh rather than leaving the table stale.
        queryClient.invalidateQueries({ queryKey: lockListKey });
        toast.error(
          bulk?.partial?.assigned
            ? `${error.message} — applied to ${bulk.partial.assigned} of ${bulk.partial.requested} before failing`
            : error?.message || "Failed to apply template",
        );
      },
    },
  );
};

// Assign grade lock
export const useAssignGradeLock = (): UseMutationResult<GradeLock, Error, { classId: string; settingId: string }> => {
  return useMutationWithInvalidation<GradeLock, Error, { classId: string; settingId: string }>(
    ({ classId, settingId }) => gradeLockApi.assignSetting(classId, settingId),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Template applied to class");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to apply template");
      },
    },
  );
};

// Lock class
export const useLockClass = (): UseMutationResult<GradeLockResponse, Error, { classId: string; reason?: string }> => {
  return useMutationWithInvalidation<GradeLockResponse, Error, { classId: string; reason?: string }>(
    ({ classId, reason }) => gradeLockApi.lockClass(classId, reason),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Class locked successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to lock class");
      },
    },
  );
};

// Unlock class
export const useUnlockClass = (): UseMutationResult<GradeLockResponse, Error, { classId: string; reason: string }> => {
  return useMutationWithInvalidation<GradeLockResponse, Error, { classId: string; reason: string }>(
    ({ classId, reason }) => gradeLockApi.unlockClass(classId, reason),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Class unlocked successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to unlock class");
      },
    },
  );
};

// Override lock
export const useOverrideLock = (): UseMutationResult<GradeLockResponse, Error, { classId: string; reason: string }> => {
  return useMutationWithInvalidation<GradeLockResponse, Error, { classId: string; reason: string }>(
    ({ classId, reason }) => gradeLockApi.overrideLock(classId, reason),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: () => {
        toast.success("Lock overridden successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to override lock");
      },
    },
  );
};

// Get unlock requests
export const useUnlockRequests = (): UseQueryResult<UnlockRequest[], Error> => {
  return useAsyncQuery<UnlockRequest[]>(
    queryKeys.admin.gradeLock.unlockRequests(),
    () => gradeLockApi.getUnlockRequests(),
  );
};

// Grant unlock request
export const useGrantUnlock = (): UseMutationResult<
  GradeLockResponse,
  Error,
  { classId: string; reason: string; newDeadline?: string }
> => {
  return useMutationWithInvalidation<
    GradeLockResponse,
    Error,
    { classId: string; reason: string; newDeadline?: string }
  >(
    ({ classId, reason, newDeadline }) =>
      gradeLockApi.grantUnlock(classId, { reason, newDeadline }),
    {
      invalidateKeys: [
        queryKeys.admin.gradeLock.list(),
        queryKeys.admin.gradeLock.unlockRequests(),
      ],
      onSuccess: () => {
        toast.success("Unlock granted successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to grant unlock");
      },
    },
  );
};

// Deny unlock request
export const useDenyUnlock = (): UseMutationResult<
  { success: boolean },
  Error,
  { classId: string; reason: string }
> => {
  return useMutationWithInvalidation<
    { success: boolean },
    Error,
    { classId: string; reason: string }
  >(
    ({ classId, reason }) => gradeLockApi.denyUnlock(classId, reason),
    {
      invalidateKeys: [
        queryKeys.admin.gradeLock.list(),
        queryKeys.admin.gradeLock.unlockRequests(),
      ],
      onSuccess: () => {
        toast.success("Unlock request denied");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to deny unlock request");
      },
    },
  );
};

// Auto-lock expired classes
export const useAutoLockExpiredClasses = (): UseMutationResult<AutoLockResponse, Error, void> => {
  return useMutationWithInvalidation<AutoLockResponse, Error, void>(
    () => gradeLockApi.autoLock(),
    {
      invalidateKeys: [queryKeys.admin.gradeLock.list()],
      onSuccess: (data) => {
        toast.success(`Auto-locked ${data.lockedCount} classes`);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Auto-lock failed");
      },
    },
  );
};
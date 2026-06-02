import { UseQueryResult, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { gradeLockApi } from "@/api/admin/grade-lock.api";
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
  AutoLockResponse,
  UnlockRequest,
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
export const useAssignSetting = (): UseMutationResult<void, Error, { classId: string; settingId: string }> => {
  return useMutationWithInvalidation<void, Error, { classId: string; settingId: string }>(
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

// Assign grade lock
export const useAssignGradeLock = (): UseMutationResult<void, Error, { classId: string; settingId: string }> => {
  return useMutationWithInvalidation<void, Error, { classId: string; settingId: string }>(
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
export const useLockClass = (): UseMutationResult<void, Error, { classId: string; reason?: string }> => {
  return useMutationWithInvalidation<void, Error, { classId: string; reason?: string }>(
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
export const useUnlockClass = (): UseMutationResult<void, Error, { classId: string; reason: string }> => {
  return useMutationWithInvalidation<void, Error, { classId: string; reason: string }>(
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
export const useOverrideLock = (): UseMutationResult<void, Error, { classId: string; reason: string }> => {
  return useMutationWithInvalidation<void, Error, { classId: string; reason: string }>(
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
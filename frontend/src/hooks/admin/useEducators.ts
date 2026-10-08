import {
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorApi } from "@/api/admin/educator.api";

import type {
  CreateEducatorRequest,
  CreateEducatorResponse,
  UpdateEducatorRequest,
  SetEducatorScheduleProfileRequest,
  EducatorScheduleProfile,
  EducatorCapacity,
  TeachableSubject,
  TeachableSubjectUsage,
  SubjectEducator,
  SubjectSlotAssignment,
  SetTeachableBundleRequest,
  SetTeachableBundleResponse,
} from "@/api/admin/educator.api";

import type { Educator } from "@/types/admin/educator.types";

import { toast } from "sonner";


// ─────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────
export const useEducators = (
  search?: string,
): UseQueryResult<Educator[], Error> => {
  return useAsyncQuery<Educator[]>(
    queryKeys.admin.educators.list({ search }),
    () => educatorApi.getAll(search),
    {
      staleTime: 1000 * 60,
    },
  );
};


// ─────────────────────────────────────────────
// DETAIL
// ─────────────────────────────────────────────
export const useEducator = (
  id: string,
): UseQueryResult<Educator, Error> => {
  return useAsyncQuery<Educator>(
    queryKeys.admin.educators.detail(id),
    () => educatorApi.getOne(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    },
  );
};


// ─────────────────────────────────────────────
// CREATE (FIXED REAL-TIME INVALIDATION)
// ─────────────────────────────────────────────
export const useCreateEducator =
  (): UseMutationResult<
    CreateEducatorResponse,
    Error,
    CreateEducatorRequest
  > => {
    const queryClient = useQueryClient();

    return useMutationWithInvalidation<
      CreateEducatorResponse,
      Error,
      CreateEducatorRequest
    >(
      (data) => educatorApi.create(data),
      {
        // 🔥 FIX: invalidate ALL educator caches (list, detail, all variants)
        invalidateKeys: [
          queryKeys.admin.educators.all,
        ],

        onSuccess: (newEducator) => {
          // detail cache
          queryClient.setQueryData(
            queryKeys.admin.educators.detail(
              newEducator.id,
            ),
            newEducator,
          );

          toast.success(
            "Educator created successfully",
          );
        },

        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              "Failed to create educator",
          );
        },
      },
    );
  };


// ─────────────────────────────────────────────
// UPDATE (OPTIMISTIC)
// ─────────────────────────────────────────────
export const useUpdateEducator =
  (): UseMutationResult<
    Educator,
    Error,
    { id: string; data: UpdateEducatorRequest }
  > => {
    const queryClient = useQueryClient();

    return useMutationWithInvalidation<
      Educator,
      Error,
      { id: string; data: UpdateEducatorRequest }
    >(
      ({ id, data }) =>
        educatorApi.update(id, data),
      {
        invalidateKeys: [
          queryKeys.admin.educators.all,
        ],

        onMutate: async ({ id, data }) => {
          await queryClient.cancelQueries({
            queryKey:
              queryKeys.admin.educators.detail(
                id,
              ),
          });

          const previous =
            queryClient.getQueryData<Educator>(
              queryKeys.admin.educators.detail(
                id,
              ),
            );

          queryClient.setQueryData<
            Educator
          >(
            queryKeys.admin.educators.detail(
              id,
            ),
            (old) =>
              old ? { ...old, ...data } : old,
          );

          return { previous };
        },

        onError: (err, variables, context: any) => {
          if (context?.previous) {
            queryClient.setQueryData(
              queryKeys.admin.educators.detail(
                variables.id,
              ),
              context.previous,
            );
          }

          toast.error(
            "Failed to update educator",
          );
        },

        onSuccess: () => {
          toast.success(
            "Educator updated successfully",
          );
        },
      },
    );
  };


// ─────────────────────────────────────────────
// DELETE (OPTIMISTIC)
// ─────────────────────────────────────────────
export const useDeleteEducator =
  (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();

    return useMutationWithInvalidation<
      void,
      Error,
      string
    >(
      (id) => educatorApi.delete(id),
      {
        invalidateKeys: [
          queryKeys.admin.educators.all,
        ],

        onMutate: async (id) => {
          await queryClient.cancelQueries({
            queryKey:
              queryKeys.admin.educators.detail(
                id,
              ),
          });

          const previous =
            queryClient.getQueryData<Educator>(
              queryKeys.admin.educators.detail(
                id,
              ),
            );

          queryClient.removeQueries({
            queryKey:
              queryKeys.admin.educators.detail(
                id,
              ),
          });

          return { previous };
        },

        onError: (err, id, context: any) => {
          if (context?.previous) {
            queryClient.setQueryData(
              queryKeys.admin.educators.detail(
                id,
              ),
              context.previous,
            );
          }

          const axiosErr = err as unknown as {
            response?: { data?: { message?: string } };
          };
          toast.error(
            axiosErr?.response?.data?.message ?? "Failed to delete educator",
          );
        },

        onSuccess: () => {
          toast.success(
            "Educator deleted successfully",
          );
        },
      },
    );
  };


// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
export const useResetEducatorPassword =
  (): UseMutationResult<
    { id: string; plainPassword: string },
    Error,
    string
  > => {
    return useMutationWithInvalidation<
      { id: string; plainPassword: string },
      Error,
      string
    >(
      (id) =>
        educatorApi.resetPassword(id),
      {
        invalidateKeys: [],
        onSuccess: () => {
          toast.success(
            "Password reset successfully",
          );
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              "Failed to reset password",
          );
        },
      },
    );
  };


// ---------------------------------------------
// TEACHABLE SUBJECTS (Phase 3)
// ---------------------------------------------

export const useTeachableSubjects = (
  educatorId: string | undefined,
  schoolYearId?: string | undefined,
): UseQueryResult<TeachableSubject[], Error> => {
  return useAsyncQuery<TeachableSubject[]>(
    queryKeys.admin.educators.teachableSubjects(educatorId ?? "", schoolYearId),
    () => educatorApi.getTeachableSubjects(educatorId!, schoolYearId),
    { enabled: !!educatorId },
  );
};

export const useEducatorCapacity = (
  educatorId: string | undefined,
  schoolYearId: string | undefined,
) =>
  useAsyncQuery<EducatorCapacity>(
    queryKeys.admin.educators.capacity(educatorId ?? "", schoolYearId ?? ""),
    () => educatorApi.getCapacity(educatorId!, schoolYearId!),
    { enabled: !!educatorId && !!schoolYearId, staleTime: 30_000 },
  );

/**
 * Other-year usage of this year's linked subjects. Drives the teachable
 * modal's untick confirm — unticking removes the GLOBAL link, so other-year
 * classes/slots must be visible before saving.
 */
export const useTeachableSubjectUsage = (
  educatorId: string | undefined,
  schoolYearId: string | undefined,
): UseQueryResult<TeachableSubjectUsage[], Error> => {
  return useAsyncQuery<TeachableSubjectUsage[]>(
    [...queryKeys.admin.educators.teachableSubjects(educatorId ?? ""), 'usage', schoolYearId ?? ''],
    () => educatorApi.getSubjectUsage(educatorId!, schoolYearId!),
    { enabled: !!educatorId && !!schoolYearId },
  );
};

/**
 * Removes global teachable keys (every year at once). Used by the Subjects
 * tab's Remove button, which must work whether or not the key has a subject
 * in the selected year.
 */
export const useRemoveTeachableKeys = () => {
  const qc = useQueryClient();
  return useMutationWithInvalidation<
    { removed: number },
    Error,
    { educatorId: string; keys: string[] }
  >(
    ({ educatorId, keys }) => educatorApi.removeTeachableKeys(educatorId, keys),
    {
      invalidateKeys: [queryKeys.admin.educators.teachableSubjects("")],
      onSuccess: (result, variables) => {
        void qc.invalidateQueries({
          queryKey: queryKeys.admin.educators.teachableSubjects(
            variables.educatorId,
          ),
        });
        void qc.invalidateQueries({ queryKey: queryKeys.admin.educators.all });
        toast.success(
          result.removed === 1
            ? "Removed teachable subject."
            : `Removed ${result.removed} teachable subjects.`,
        );
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to remove subject.",
        );
      },
    },
  );
};

/**
 * One atomic teachable save for the slot-picker modal: replaces the link
 * set AND the slot picks in a single transaction. Any failure leaves the
 * existing links untouched, so there is no half-saved state to reconcile.
 */
export const useSetTeachableBundle = () => {
  const qc = useQueryClient();
  return useMutationWithInvalidation<
    SetTeachableBundleResponse,
    Error,
    { educatorId: string } & SetTeachableBundleRequest
  >(
    ({ educatorId, ...body }) =>
      educatorApi.setTeachableBundle(educatorId, body),
    {
      invalidateKeys: [queryKeys.admin.educators.teachableSubjects("")],
      onSuccess: (result, variables) => {
        void qc.invalidateQueries({
          queryKey:
            queryKeys.admin.educators.teachableSubjects(variables.educatorId),
        });
        void qc.invalidateQueries({
          queryKey: queryKeys.admin.educators.slots(variables.educatorId),
        });
        void qc.invalidateQueries({
          queryKey: queryKeys.admin.educators.capacity(
            variables.educatorId,
            variables.schoolYearId,
          ),
        });
        void qc.invalidateQueries({ queryKey: queryKeys.admin.educators.all });
        toast.success(
          variables.subjectIds.length === 0
            ? "Cleared teachable subjects."
            : `Saved ${result.count} teachable subject${result.count === 1 ? "" : "s"}.`,
        );
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to save teachable subjects.",
        );
      },
    },
  );
};

export const useSubjectEducators = (
  subjectId: string | null | undefined,
): UseQueryResult<SubjectEducator[], Error> => {
  return useAsyncQuery<SubjectEducator[]>(
    queryKeys.admin.subjects.educators(subjectId ?? ""),
    () => educatorApi.getSubjectEducators(subjectId!),
    { enabled: !!subjectId },
  );
};

// ---------------------------------------------
// AVAILABILITY (Phase 4)
// ---------------------------------------------

export const useScheduleProfile = (
  educatorId: string | undefined,
): UseQueryResult<EducatorScheduleProfile, Error> => {
  return useAsyncQuery<EducatorScheduleProfile>(
    queryKeys.admin.educators.scheduleProfile(educatorId ?? ""),
    () => educatorApi.getScheduleProfile(educatorId!),
    { enabled: !!educatorId },
  );
};

export const useSetScheduleProfile = () => {
  const qc = useQueryClient();
  return useMutationWithInvalidation<
    EducatorScheduleProfile,
    Error,
    { educatorId: string } & SetEducatorScheduleProfileRequest
  >(
    ({ educatorId, ...body }) =>
      educatorApi.setScheduleProfile(educatorId, body),
    {
      invalidateKeys: [queryKeys.admin.educators.scheduleProfile("")],
      onSuccess: (result) => {
        void qc.invalidateQueries({ queryKey: queryKeys.admin.educators.all });
        toast.success("Availability updated.");
        // Existing classes are never moved automatically, so say so plainly.
        if ((result.outsideAvailabilityClassCount ?? 0) > 0) {
          toast.warning(
            `${result.outsideAvailabilityClassCount} existing class schedule(s) fall outside the new availability. They were left in place - move them yourself.`,
            { duration: 8000 },
          );
        }
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to update availability.",
        );
      },
    },
  );
};

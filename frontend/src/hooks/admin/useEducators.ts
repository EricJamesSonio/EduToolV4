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
  CarryOverEducatorSubjectsRequest,
  CarryOverEducatorSubjectsResponse,
  SetEducatorScheduleProfileRequest,
  EducatorScheduleProfile,
  EducatorCapacity,
  TeachableSubject,
  SubjectEducator,
  SubjectSlotAssignment,
  SetSubjectSlotsResponse,
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

          toast.error(
            "Failed to delete educator",
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
): UseQueryResult<TeachableSubject[], Error> => {
  return useAsyncQuery<TeachableSubject[]>(
    queryKeys.admin.educators.teachableSubjects(educatorId ?? ""),
    () => educatorApi.getTeachableSubjects(educatorId!),
    { enabled: !!educatorId },
  );
};

export const useSetTeachableSubjects = () => {
  const qc = useQueryClient();
  return useMutationWithInvalidation<
    { count: number },
    Error,
    { educatorId: string; subjectIds: string[] }
  >(
    ({ educatorId, subjectIds }) =>
      educatorApi.setTeachableSubjects(educatorId, subjectIds),
    {
      invalidateKeys: [queryKeys.admin.educators.teachableSubjects("")],
      onSuccess: (result, variables) => {
        void qc.invalidateQueries({ queryKey: queryKeys.admin.educators.all });
        toast.success(
          variables.subjectIds.length === 0
            ? "Cleared teachable subjects."
            : `Saved ${result.count} teachable subject${result.count === 1 ? "" : "s"}.`,
        );
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            "Failed to save teachable subjects.",
        );
      },
    },
  );
};

export const useCarryOverTeachableSubjects = () => {
  return useMutationWithInvalidation<
    CarryOverEducatorSubjectsResponse,
    Error,
    CarryOverEducatorSubjectsRequest
  >(
    (body) => educatorApi.carryOverTeachableSubjects(body),
    {
      invalidateKeys: [queryKeys.admin.educators.teachableSubjects("")],
      onSuccess: (result) => {
        toast.success(
          `Copied ${result.created} subject link${result.created === 1 ? "" : "s"}` +
            (result.sectionsCarried > 0
              ? ` with ${result.sectionsCarried} section assignment${result.sectionsCarried === 1 ? "" : "s"}.`
              : ".") +
            (result.unmatched.length > 0
              ? ` ${result.unmatched.length} could not be matched.`
              : ""),
        );
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to copy subjects.",
        );
      },
    },
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

export const useSetSubjectSlots = () => {
  return useMutationWithInvalidation<
    SetSubjectSlotsResponse,
    Error,
    {
      educatorId: string;
      schoolYearId: string;
      assignments: SubjectSlotAssignment[];
    }
  >(
    ({ educatorId, schoolYearId, assignments }) =>
      educatorApi.setSubjectSlots(educatorId, schoolYearId, assignments),
    {
      invalidateKeys: [queryKeys.admin.educators.teachableSubjects("")],
      onSuccess: (result) => {
        toast.success(
          `Saved slots for ${result.updated} subject${result.updated === 1 ? "" : "s"}.`,
        );
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to save slots.",
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

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
        // 🔥 FIX: invalidate ALL educator lists properly
        invalidateKeys: [
          queryKeys.admin.educators.list({}),
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
          queryKeys.admin.educators.list({}),
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
          queryKeys.admin.educators.list({}),
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
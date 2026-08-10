import {
  useAsyncQuery,
  useAsyncMutation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { adminConcernApi } from "@/api/admin/concern.api";
import type {
  ConcernCategoryItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/api/admin/concern.api";

export const useConcernCategories = () => {
  return useAsyncQuery<ConcernCategoryItem[]>(
    queryKeys.admin.concerns.categories(),
    () => adminConcernApi.getCategories(),
    { meta: { preset: "list", feature: "concerns" } },
  );
};

export const useCreateConcernCategory = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernCategoryItem, Error, CreateCategoryRequest>(
    (payload) => adminConcernApi.createCategory(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.categories() });
      },
    },
  );
};

export const useUpdateConcernCategory = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<
    ConcernCategoryItem,
    Error,
    { categoryId: string; data: UpdateCategoryRequest }
  >(
    ({ categoryId, data }) => adminConcernApi.updateCategory(categoryId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.categories() });
      },
    },
  );
};
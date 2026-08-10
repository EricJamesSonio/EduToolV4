import {
  useAsyncQuery,
  useAsyncMutation,
} from "@/hooks/hook-factory.utils";
import { usePaginatedQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { studentConcernApi } from "@/api/student/concern.api";
import type {
  ConcernCategoryItem,
  ConcernItem,
  PaginatedConcerns,
  SubmitConcernRequest,
  ReplyConcernRequest,
} from "@/api/student/concern.api";

export const useConcernCategories = () => {
  return useAsyncQuery<ConcernCategoryItem[]>(
    queryKeys.student.concerns.categories(),
    () => studentConcernApi.getCategories(),
    { meta: { preset: "list", feature: "concerns" } },
  );
};

export const useMyConcerns = (page = 1, limit = 20) => {
  return usePaginatedQuery<PaginatedConcerns>(
    queryKeys.student.concerns.mine(),
    (p) => studentConcernApi.listMine(p, limit),
    {
      page,
      pageSize: limit,
      meta: { preset: "list", feature: "concerns" },
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );
};

export const useConcernThread = (concernId?: string) => {
  return useAsyncQuery<ConcernItem>(
    queryKeys.student.concerns.detail(concernId ?? ""),
    () => studentConcernApi.getThread(concernId!),
    {
      enabled: !!concernId,
      meta: { preset: "detail", feature: "concerns" },
      // Poll so a reply from staff appears live without reloading.
      refetchInterval: 20_000,
      refetchOnWindowFocus: true,
    },
  );
};

export const useSubmitConcern = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernItem, Error, SubmitConcernRequest>(
    (payload) => studentConcernApi.submit(payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.student.concerns.mine() });
      },
    },
  );
};

export const useReplyToConcern = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernItem, Error, { concernId: string; body: string }>(
    ({ concernId, body }) => studentConcernApi.reply(concernId, { body } as ReplyConcernRequest),
    {
      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.student.concerns.mine() });
        queryClient.invalidateQueries({ queryKey: queryKeys.student.concerns.detail(vars.concernId) });
      },
    },
  );
};
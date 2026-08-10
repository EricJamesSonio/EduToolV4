import {
  useAsyncQuery,
  useAsyncMutation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { adminConcernApi } from "@/api/admin/concern.api";
import type {
  PaginatedStaffConcerns,
  StaffConcernRow,
  ListStaffFilters,
  ConcernDetailItem,
  ReplyConcernRequest,
} from "@/api/admin/concern.api";

export const useStaffConcerns = (
  filters: ListStaffFilters = {},
) => {
  return useAsyncQuery<PaginatedStaffConcerns>(
    queryKeys.admin.concerns.list(filters),
    () => adminConcernApi.listAll(filters),
    {
      meta: { preset: "list", feature: "concerns" },
      // New concerns arrive from other sessions/tabs, so poll to surface them
      // without a manual reload. The global default is refetchOnWindowFocus:false,
      // so an explicit interval is the reliable path.
      refetchInterval: 20_000,
      refetchOnWindowFocus: true,
    },
  );
};

export const useStaffConcernThread = (concernId?: string) => {
  return useAsyncQuery<ConcernDetailItem>(
    queryKeys.admin.concerns.detail(concernId ?? ""),
    () => adminConcernApi.getThread(concernId!),
    { enabled: !!concernId, meta: { preset: "detail", feature: "concerns" } },
  );
};

export const useStaffReplyToConcern = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernDetailItem, Error, { concernId: string; body: string }>(
    ({ concernId, body }) =>
      adminConcernApi.reply(concernId, { body } as ReplyConcernRequest),
    {
      onSuccess: (_res, { concernId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.detail(concernId) });
      },
    },
  );
};

export const useResolveConcern = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernDetailItem, Error, string>(
    (concernId) => adminConcernApi.resolve(concernId),
    {
      onSuccess: (_res, concernId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.detail(concernId) });
      },
    },
  );
};

export const useReopenConcern = () => {
  const queryClient = useQueryClient();
  return useAsyncMutation<ConcernDetailItem, Error, string>(
    (concernId) => adminConcernApi.reopen(concernId),
    {
      onSuccess: (_res, concernId) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.concerns.detail(concernId) });
      },
    },
  );
};

// Re-export row type for convenience at the call site.
export type { StaffConcernRow };
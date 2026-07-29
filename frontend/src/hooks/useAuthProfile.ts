import { useQueryClient } from "@tanstack/react-query";
import { useAppQuery } from "@/hooks/useAppQuery";
import { authApi } from "@/api/auth.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useAuthStore } from "@/store/auth.store";
import { useCallback } from "react";

export function useAuthProfile() {
  const token = useAuthStore((s) => s.accessToken);
  return useAppQuery(
    queryKeys.auth.me(),
    () => authApi.getMe(),
    {
      meta: { preset: 'user', feature: 'auth' },
      retry: false,
      enabled: !!token,
    },
  );
}

export function useBootstrapAuth() {
  const queryClient = useQueryClient();

  const bootstrap = useCallback(async (): Promise<void> => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      try {
        const me = await authApi.getMe();
        queryClient.setQueryData(queryKeys.auth.me(), me);
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setLoading(false);
      }
      return;
    }

    try {
      const { accessToken: newToken } = await authApi.refresh();
      useAuthStore.getState().setAccessToken(newToken);
      const me = await authApi.getMe();
      queryClient.setQueryData(queryKeys.auth.me(), me);
    } catch {
      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  }, [queryClient]);

  return bootstrap;
}

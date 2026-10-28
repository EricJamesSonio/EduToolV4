import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/auth.api";
import { useAppQuery } from "@/hooks/useAppQuery";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useAuthStore } from "@/store/auth.store";

const fetchAuthProfile = () => authApi.getMe();

export function useAuthProfile() {
  const token = useAuthStore((s) => s.accessToken);

  return useAppQuery(
    queryKeys.auth.me(),
    fetchAuthProfile,
    {
      meta: { preset: "user", feature: "auth" },
      retry: false,
      enabled: !!token,
    },
  );
}

export function useBootstrapAuth() {
  const queryClient = useQueryClient();

  const bootstrap = useCallback(async (): Promise<void> => {
    const token = useAuthStore.getState().accessToken;

    try {
      if (!token) {
        const { accessToken: newToken } = await authApi.refresh();
        useAuthStore.getState().setAccessToken(newToken);
      }

      await queryClient.fetchQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: fetchAuthProfile,
        staleTime: 0,
        retry: false,
      });
    } catch {
      useAuthStore.getState().clearAuth();
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  }, [queryClient]);

  return bootstrap;
}
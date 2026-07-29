"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHomePath } from "@/utils/role.util";
import { useAuthProfile, useBootstrapAuth } from "@/hooks/useAuthProfile";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { AuthUser } from "@/types/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAccessToken, clearAuth } = useAuthStore();
  const bootstrap = useBootstrapAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const { data: user, isLoading } = useAuthProfile();

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { accessToken: newToken } = await authApi.login({ email, password });

      useAuthStore.getState().setAccessToken(newToken);

      const me = await authApi.getMe();
      queryClient.setQueryData(queryKeys.auth.me(), me);

      router.push(getRoleHomePath(me.role));
    },
    [router, queryClient]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Swallow — we clear local state regardless
    } finally {
      clearAuth();
      queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
    }
  }, [clearAuth, queryClient]);

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}

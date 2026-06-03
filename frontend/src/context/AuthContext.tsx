"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHomePath } from "@/utils/role.util";
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
  const { user, accessToken, setUser, setAccessToken, setLoading, clearAuth } =
    useAuthStore();

  // ─── Bootstrap on mount ───────────────────────────────────────────────────
  // Try to use the refresh token cookie to obtain a fresh access token.
  // This replaces the old localStorage-based bootstrap.
  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const token = useAuthStore.getState().accessToken;

      // If we already have an access token in memory, just verify it
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch {
          clearAuth();
        } finally {
          setLoading(false);
        }
        return;
      }

      // No token in memory — try to refresh via cookie
      try {
        const { accessToken: newToken } = await authApi.refresh();
        setAccessToken(newToken);

        const me = await authApi.getMe(newToken);
        setUser(me);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      // Login sets the refresh token as an HTTP-only cookie on the backend.
      // The response only contains the access token.
      const { accessToken: newToken } = await authApi.login({ email, password });

      setAccessToken(newToken);

      // Pass token explicitly to avoid race condition where
      // the interceptor hasn't picked up the new token yet
      const me = await authApi.getMe(newToken);
      setUser(me);

      router.push(getRoleHomePath(me.role));
    },
    [router, setUser, setAccessToken]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Swallow — we clear local state regardless
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value: AuthContextValue = {
    user,
    isLoading: useAuthStore((s) => s.isLoading),
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

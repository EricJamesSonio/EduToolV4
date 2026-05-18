// frontend/src/context/AuthContext.tsx
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
import { saveTokens, clearTokens } from "@/api/client";
import { useAuthStore } from "@/store/auth.store";
import { getRoleHomePath } from "@/utils/role.util";
import type { AuthUser, AuthTokens } from "@/types/auth.types";

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
  const { user, accessToken, setUser, setTokens, setLoading, clearAuth } =
    useAuthStore();

useEffect(() => {
  const bootstrap = async (): Promise<void> => {
    // Wait for persist rehydration to complete before reading accessToken
    await useAuthStore.persist.rehydrate();

    const token = useAuthStore.getState().accessToken;

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      clearAuth();
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  bootstrap();
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const tokens: AuthTokens = await authApi.login({ email, password });

      // Save to localStorage first
      saveTokens(tokens.accessToken, tokens.refreshToken);
      setTokens(tokens.accessToken, tokens.refreshToken);

      // Pass token explicitly to avoid race condition where
      // interceptor hasn't picked up the newly saved localStorage token yet
      const me = await authApi.getMe(tokens.accessToken);
      setUser(me);

      router.push(getRoleHomePath(me.role));
    },
    [router, setTokens, setUser]
  );

// Replace logout:
const logout = useCallback(async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Swallow — we clear local state regardless
  } finally {
    clearAuth();
    clearTokens();
    // Don't navigate here — let the caller (LogoutButton) handle navigation
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
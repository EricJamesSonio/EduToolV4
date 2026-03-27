"use client";

import {
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

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, accessToken, setUser, setTokens, setLoading, clearAuth } =
    useAuthStore();

  // ── Bootstrap: on mount, if we have an accessToken, fetch the current user ──
  useEffect(() => {
    const bootstrap = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.getMe();
        setUser(me);
      } catch {
        // Token is invalid or expired and refresh already failed in the
        // Axios interceptor — clear everything and let the user log in again
        clearAuth();
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens: AuthTokens = await authApi.login({ email, password });

      // Persist tokens in localStorage (via client helpers) and store
      saveTokens(tokens.accessToken, tokens.refreshToken);
      setTokens(tokens.accessToken, tokens.refreshToken);

      // Fetch the full user profile
      const me = await authApi.getMe();
      setUser(me);

      // Redirect to role home
      router.push(getRoleHomePath(me.role));
    },
    [router, setTokens, setUser]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Swallow — we clear local state regardless
    } finally {
      clearAuth();
      clearTokens();
      router.push("/login");
    }
  }, [clearAuth, router]);

  // ── Value ──────────────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    isLoading: useAuthStore((s) => s.isLoading),
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
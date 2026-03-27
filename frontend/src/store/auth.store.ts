import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ─── State ─────────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

      // ─── Actions ───────────────────────────────────────────────────────
      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
        }),
    }),
    {
      name: "edutool-auth",
      storage: createJSONStorage(() => localStorage),
      // Persist both tokens; user is re-fetched from /auth/me on mount
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
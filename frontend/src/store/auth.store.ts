import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // ─── State ───────────────────────────────────────────────────────────
      user: null,
      token: null,
      isLoading: true, // true on mount until session is verified

      // ─── Actions ─────────────────────────────────────────────────────────
      setUser: (user) => set({ user }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () => set({ user: null, token: null, isLoading: false }),
    }),
    {
      name: "edutool-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist the token — user is re-fetched from /auth/me on mount.
      // This avoids serving stale user data from storage.
      partialize: (state) => ({ token: state.token }),
    }
  )
);
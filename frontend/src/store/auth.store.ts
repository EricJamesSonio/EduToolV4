import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/types/auth.types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isLoading: false,
        }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);

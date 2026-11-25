import client from "./client";
import { API_BASE_URL } from "@/config/api.config";
import type { AuthUser } from "@/types/auth.types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await client.post<{ success: boolean; data: LoginResponse }>("/auth/login", data);
    return res.data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await client.get<{ success: boolean; data: AuthUser }>("/auth/me");
    return res.data.data;
  },

  refresh: async (): Promise<RefreshResponse> => {
    const res = await client.post<{ success: boolean; data: RefreshResponse }>("/auth/refresh");
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await client.post("/auth/logout");
  },

  /**
   * Fire-and-forget "this page is being left" signal. Uses fetch with
   * keepalive so it survives page unload. No body and no custom headers, so
   * it stays a simple CORS request (no preflight) and carries the refresh
   * cookie.
   */
  notifySessionClose: (): void => {
    if (typeof window === "undefined") return;
    try {
      const base = String(API_BASE_URL).replace(/\/+$/, "");
      void fetch(`${base}/auth/session-close`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Best effort only: the session cookie still dies with the browser.
    }
  },
};
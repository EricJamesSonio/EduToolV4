// frontend/src/api/auth.api.ts
import client from "./client";
import type { AuthUser } from "@/types/auth.types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await client.post<{ success: boolean; data: LoginResponse }>("/auth/login", data);
    return res.data.data; // unwrap the ResponseInterceptor wrapper
  },

  getMe: async (accessToken?: string): Promise<AuthUser> => {
    const res = await client.get<{ success: boolean; data: AuthUser }>("/auth/me", {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });
    return res.data.data; // unwrap
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await client.post<{ success: boolean; data: RefreshResponse }>("/auth/refresh", {
      refreshToken,
    });
    return res.data.data; // unwrap
  },

  logout: async (): Promise<void> => {
    await client.post("/auth/logout");
  },
};
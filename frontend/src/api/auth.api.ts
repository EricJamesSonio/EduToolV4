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
    const res = await client.post<LoginResponse>("/auth/login", data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await client.post("/auth/logout");
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await client.post<RefreshResponse>("/auth/refresh", {
      refreshToken,
    });
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await client.get<AuthUser>("/auth/me");
    return res.data;
  },
};
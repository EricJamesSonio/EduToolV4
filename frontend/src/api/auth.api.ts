import client from "./client";
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
};

import apiClient from "@/api/client";
import type { AuthTokens, AuthUser } from "@/types/auth.types";

interface LoginDto {
  email: string;
  password: string;
}

interface RefreshDto {
  refreshToken: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthTokens> => {
    const { data } = await apiClient.post<AuthTokens>("/auth/login", dto);
    return data;
  },

  refresh: async (dto: RefreshDto): Promise<AuthTokens> => {
    const { data } = await apiClient.post<AuthTokens>("/auth/refresh", dto);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  },
};
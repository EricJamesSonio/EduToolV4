import client from "./client";
import type { AuthUser } from "@/types/auth.types";

export interface UpdateProfileRequest {
  fullName?: string;
  personalEmail?: string | null;
  profileImage?: string;
}

export const profileApi = {
  getProfile: async (): Promise<AuthUser> => {
    const res = await client.get<{ success: boolean; data: AuthUser }>("/profile");
    return res.data.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<AuthUser> => {
    const res = await client.patch<{ success: boolean; data: AuthUser }>("/profile", data);
    return res.data.data;
  },
};
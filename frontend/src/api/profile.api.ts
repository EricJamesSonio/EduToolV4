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

  changePersonalEmailRequest: async (
    newEmail: string,
  ): Promise<{ message: string }> => {
    const res = await client.post<{ success: boolean; data: { message: string } }>(
      "/profile/personal-email/change-request",
      { newEmail },
    );
    return res.data.data;
  },

  changePersonalEmailVerify: async (
    newEmail: string,
    code: string,
  ): Promise<{ accountId: string; personalEmail: string }> => {
    const res = await client.post<{
      success: boolean;
      data: { accountId: string; personalEmail: string };
    }>("/profile/personal-email/change-verify", { newEmail, code });
    return res.data.data;
  },
};
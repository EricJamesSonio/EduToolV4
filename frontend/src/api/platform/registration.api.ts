import client from "@/api/client";

export interface RegistrationRequest {
  id: string;
  email: string;
  full_name: string;
  plan: string | null;
  institution_name: string | null;
  role: string | null;
  student_count: string | null;
  programs_departments: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface ApproveResult {
  email: string;
  fullName: string;
  password: string;
}

export const registrationApi = {
  list: async (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await client.get<{ success: boolean; data: { data: RegistrationRequest[]; total: number } }>(
      "/platform/registration-requests",
      { params }
    );
    return res.data.data;
  },

  approve: async (id: string, adminEmail?: string): Promise<ApproveResult> => {
    const res = await client.post<{ success: boolean; data: ApproveResult }>(
      `/platform/registration-requests/${id}/approve`,
      { adminEmail }
    );
    return res.data.data;
  },

  reject: async (id: string) => {
    const res = await client.post<{ success: boolean; data: { message: string } }>(
      `/platform/registration-requests/${id}/reject`
    );
    return res.data.data;
  },

  sendCredentials: async (id: string) => {
    const res = await client.post<{ success: boolean; data: { message: string } }>(
      `/platform/registration-requests/${id}/send-credentials`
    );
    return res.data.data;
  },
};

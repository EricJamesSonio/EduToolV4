// src/api/admin/enrollment-portal.api.ts
// Registrar (admin) enrollment portal client. Uses the shared authenticated
// client (auto-attaches admin bearer token), mirroring grade-lock.api.ts.
import client from "@/api/client";
import type {
  EnrollmentPeriod,
  PeriodListResponse,
  CreateEnrollmentPeriodInput,
  PaginatedApplications,
  ApplicationListItem,
  ApplicationDetail,
  ApproveApplicationResult,
  ActionApplicationResult,
  EnrollmentApplicationStatus,
} from "@/types/enrollment-portal.types";

type ApiResponse<T> = { success: boolean; data: T };

export interface ApplicationQuery {
  application_code?: string;
  personal_email?: string;
  status?: EnrollmentApplicationStatus;
  period_id?: string;
  page?: number;
  limit?: number;
}

export const enrollmentPortalApi = {
  // ── Periods ───────────────────────────────────────────────────────────────

  getPeriods: async (): Promise<PeriodListResponse> => {
    const res = await client.get<ApiResponse<PeriodListResponse>>(
      "/admin/enrollment-portal/periods",
    );
    return res.data.data;
  },

  createPeriod: async (data: CreateEnrollmentPeriodInput): Promise<EnrollmentPeriod> => {
    const res = await client.post<ApiResponse<EnrollmentPeriod>>(
      "/admin/enrollment-portal/periods",
      data,
    );
    return res.data.data;
  },

  updatePeriod: async (
    id: string,
    data: Partial<CreateEnrollmentPeriodInput>,
  ): Promise<EnrollmentPeriod> => {
    const res = await client.patch<ApiResponse<EnrollmentPeriod>>(
      `/admin/enrollment-portal/periods/${id}`,
      data,
    );
    return res.data.data;
  },

  deletePeriod: async (id: string): Promise<{ success: boolean }> => {
    const res = await client.delete<ApiResponse<{ success: boolean }>>(
      `/admin/enrollment-portal/periods/${id}`,
    );
    return res.data.data;
  },

  // ── Applications ──────────────────────────────────────────────────────────

  getApplications: async (params: ApplicationQuery): Promise<PaginatedApplications> => {
    const res = await client.get<ApiResponse<PaginatedApplications>>(
      "/admin/enrollment-portal/applications",
      { params },
    );
    return res.data.data;
  },

  getApplication: async (id: string): Promise<ApplicationDetail> => {
    const res = await client.get<ApiResponse<ApplicationDetail>>(
      `/admin/enrollment-portal/applications/${id}`,
    );
    return res.data.data;
  },

  approveApplication: async (id: string): Promise<ApproveApplicationResult> => {
    const res = await client.post<ApiResponse<ApproveApplicationResult>>(
      `/admin/enrollment-portal/applications/${id}/approve`,
    );
    return res.data.data;
  },

  rejectApplication: async (id: string, reason: string): Promise<ActionApplicationResult> => {
    const res = await client.post<ApiResponse<ActionApplicationResult>>(
      `/admin/enrollment-portal/applications/${id}/reject`,
      { reason },
    );
    return res.data.data;
  },

  unlockApplication: async (input: {
    personal_email?: string;
    application_code?: string;
  }): Promise<ActionApplicationResult> => {
    const res = await client.post<ApiResponse<ActionApplicationResult>>(
      "/admin/enrollment-portal/applications/unlock",
      input,
    );
    return res.data.data;
  },
};

export type { ApplicationListItem };
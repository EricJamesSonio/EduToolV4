// src/api/public/enrollment-portal.api.ts
// Public, unauthenticated enrollment portal client.
//
// The shared admin `client` auto-attaches an account bearer token and performs
// 401 refresh — neither belongs on the anonymous portal. Following the
// landing.api.ts convention we use a dedicated bare axios instance. The only
// "token" used here is the short-lived enrollment session token issued by
// OTP-verify, passed explicitly as the Authorization header.
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";
import type {
  PublicPortalInfo,
  EnrollmentApplicationView,
  VerifyOtpResult,
  PublicApplicationLookup,
} from "@/types/enrollment-portal.types";

const publicClient = axios.create({ baseURL: API_BASE_URL });

export interface UpsertApplicationPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  age?: number;
  address?: string;
  contact_number?: string;
  last_school_graduated?: string;
  program_id: string;
  course_id?: string;
  strand_id?: string;
  level_id: string;
}

type ApiResponse<T> = { success: boolean; data: T };

export const enrollmentPortalApi = {
  getPortalInfo: async (orgSlug: string, periodToken: string): Promise<PublicPortalInfo> => {
    const res = await publicClient.get<ApiResponse<PublicPortalInfo>>(
      `/enroll/${orgSlug}/${periodToken}`,
    );
    return res.data.data;
  },

  requestOtp: async (orgSlug: string, periodToken: string, email: string): Promise<string> => {
    const res = await publicClient.post<ApiResponse<{ message: string }>>(
      `/enroll/${orgSlug}/${periodToken}/otp`,
      { email },
    );
    return res.data.data.message;
  },

  verifyOtp: async (
    orgSlug: string,
    periodToken: string,
    email: string,
    code: string,
  ): Promise<VerifyOtpResult> => {
    const res = await publicClient.post<ApiResponse<VerifyOtpResult>>(
      `/enroll/${orgSlug}/${periodToken}/otp/verify`,
      { email, code },
    );
    return res.data.data;
  },

  createApplication: async (
    orgSlug: string,
    periodToken: string,
    sessionToken: string,
    payload: UpsertApplicationPayload,
  ): Promise<EnrollmentApplicationView> => {
    const res = await publicClient.post<ApiResponse<EnrollmentApplicationView>>(
      `/enroll/${orgSlug}/${periodToken}/application`,
      payload,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return res.data.data;
  },

  updateApplication: async (
    orgSlug: string,
    periodToken: string,
    sessionToken: string,
    payload: UpsertApplicationPayload,
  ): Promise<EnrollmentApplicationView> => {
    const res = await publicClient.patch<ApiResponse<EnrollmentApplicationView>>(
      `/enroll/${orgSlug}/${periodToken}/application`,
      payload,
      { headers: { Authorization: `Bearer ${sessionToken}` } },
    );
    return res.data.data;
  },

  lookupApplication: async (
    applicationCode: string,
    email?: string,
  ): Promise<PublicApplicationLookup[]> => {
    const res = await publicClient.get<ApiResponse<PublicApplicationLookup[]>>(
      `/enroll/lookup/${applicationCode}`,
      { params: email ? { email } : undefined },
    );
    return res.data.data;
  },
};
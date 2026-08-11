import client from "@/api/client";

export interface RegisterPayload {
  email: string;
  fullName: string;
  plan?: string;
  institutionName?: string;
  role?: string;
  studentCount?: string;
  programsDepartments?: string;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
}

export async function register(payload: RegisterPayload): Promise<{ message: string }> {
  const { data } = await client.post("/auth/register", payload);
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<{ message: string }> {
  const { data } = await client.post("/auth/verify-otp", payload);
  return data;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const { data } = await client.post("/auth/resend-otp", { email });
  return data;
}

// ─── Admin Request (public applicant flow) ──────────────────────────────────

type ApiEnvelope<T> = { success: boolean; data: T };

export interface AdminRequestView {
  id: string;
  email: string;
  full_name: string;
  plan: string | null;
  institution_name: string | null;
  role: string | null;
  student_count: string | null;
  programs_departments: string | null;
  status: string;
  revision_notes: Record<string, string> | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRequestVerifyResult {
  token: string;
  mode: "edit" | "create";
  request?: AdminRequestView;
}

export interface AdminRequestSubmitPayload {
  full_name: string;
  plan?: string;
  institution_name?: string;
  role?: string;
  student_count?: string;
  programs_departments?: string;
}

export async function sendAdminRequestOtp(email: string): Promise<{ message: string }> {
  const { data } = await client.post<ApiEnvelope<{ message: string }>>(
    "/auth/admin-request/otp",
    { email },
  );
  return data.data;
}

export async function verifyAdminRequestOtp(payload: {
  email: string;
  code: string;
}): Promise<AdminRequestVerifyResult> {
  const { data } = await client.post<ApiEnvelope<AdminRequestVerifyResult>>(
    "/auth/admin-request/verify",
    payload,
  );
  return data.data;
}

export async function getAdminRequestMe(
  sessionToken: string,
): Promise<{ request: AdminRequestView | null }> {
  const { data } = await client.get<ApiEnvelope<{ request: AdminRequestView | null }>>(
    "/auth/admin-request/me",
    { headers: { Authorization: `Bearer ${sessionToken}` } },
  );
  return data.data;
}

export async function submitAdminRequest(
  sessionToken: string,
  payload: AdminRequestSubmitPayload,
): Promise<{ request: AdminRequestView }> {
  const { data } = await client.post<ApiEnvelope<{ request: AdminRequestView }>>(
    "/auth/admin-request/submit",
    payload,
    { headers: { Authorization: `Bearer ${sessionToken}` } },
  );
  return data.data;
}

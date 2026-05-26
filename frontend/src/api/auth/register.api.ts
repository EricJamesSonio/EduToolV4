import client from "@/api/client";

export interface RegisterPayload {
  email: string;
  fullName: string;
  plan?: string;
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

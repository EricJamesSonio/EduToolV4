export type Role = "platform_owner" | "admin" | "educator" | "student";

export type AccountStatus =
  | "active"
  | "blocked"
  | "suspended"
  | "pending"
  | "dropped"
  | "transferred"
  | "graduated";

export interface AuthUser {
  id: string;
  orgId: string | null;
  role: Role;
  email: string;
  status: AccountStatus;
  fullName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  profileImage?: string | null;
  personalEmail?: string | null;
}

export interface TokenPayload {
  sub: string;
  orgId: string | null;
  role: Role;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export type Role = "platform_owner" | "admin" | "educator" | "student";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  name: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  orgId: string;
  name: string;
  iat: number;
  exp: number;
}
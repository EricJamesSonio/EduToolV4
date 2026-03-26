import type { Role } from "@/types/auth.types";

export interface TokenPayload {
  sub: string;       // user id
  email: string;
  role: Role;
  orgId: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Decodes a JWT without verifying the signature.
 * Verification is the backend's responsibility — this is for reading claims only.
 */
export function decodeJwt(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 → JSON
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is expired or cannot be decoded.
 * Adds a 30-second buffer to account for clock skew.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const bufferSeconds = 30;

  return payload.exp < nowSeconds + bufferSeconds;
}

/**
 * Extracts the role claim from the token.
 * Returns null if the token is invalid or has no role.
 */
export function getTokenRole(token: string): Role | null {
  const payload = decodeJwt(token);
  return payload?.role ?? null;
}
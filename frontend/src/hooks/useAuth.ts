"use client";

import { useAuthContext } from "@/context/AuthContext";

/**
 * Convenience hook for consuming the AuthContext.
 * Must be used inside a component wrapped by <AuthProvider>.
 */
export function useAuth() {
  return useAuthContext();
}
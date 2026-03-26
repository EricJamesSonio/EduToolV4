"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types/auth.types";

/**
 * Returns the current user's role and provides a redirect guard.
 *
 * Usage in portal layouts:
 *   const { role } = useRole();
 *   useRoleGuard(["admin"]);
 */
export function useRole() {
  const { user } = useAuth();
  return { role: user?.role ?? null };
}

/**
 * Redirects to /login if the user's role is not in the allowed list.
 * Also redirects if the user is not yet loaded (after loading completes).
 *
 * @param allowedRoles  Roles permitted to access the current route
 */
export function useRoleGuard(allowedRoles: Role[]) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect to their own portal home instead of a generic 403
      router.replace("/login");
    }
  }, [user, isLoading, router, allowedRoles]);
}
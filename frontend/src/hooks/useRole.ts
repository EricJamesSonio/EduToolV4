"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
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
 * Returns `true` when it is safe to render protected children (authenticated
 * and authorised).  Return `false` during loading so the layout can avoid
 * flashing protected content to unauthorised users.
 *
 * @param allowedRoles  Roles permitted to access the current route
 */
export function useRoleGuard(allowedRoles: Role[]): boolean {
  const { user, isLoading } = useAuth();

  /* Redirect BEFORE browser paints — this ensures the protected page is
     never visible to unauthorised users or visitors with expired tokens. */
  useLayoutEffect(() => {
    if (isLoading) return;

    if (!user) {
      window.location.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      window.location.replace("/login");
    }
  }, [user, isLoading, allowedRoles]);

  /* Handle bfcache restore — when user presses back after logout the
     component is not remounted so the effect above is skipped.  The
     pageshow event fires even on persisted (cached) restores. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        window.location.replace("/login");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  /* Prevent rendering children until we are certain the user is
     authenticated and has the correct role.                          */
  if (isLoading) return false;
  if (!user) return false;
  if (!allowedRoles.includes(user.role)) return false;
  return true;
}
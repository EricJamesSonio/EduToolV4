"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types/auth.types";

/**
 * Returns the current user's role and provides a redirect guard.
 *
 * Usage in portal layouts:
 *   const { role } = useRole();
 *   const { status } = useRoleGuard(["admin"]);
 */
export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role ?? null,
    isRegistrar: user?.isRegistrar ?? false,
  };
}

export type RoleGuardStatus = "loading" | "allowed" | "redirecting";

/**
 * Protects a route from unauthenticated / unauthorised users.
 *
 * - "loading"    → auth state not resolved yet (session restore in flight).
 *                  Layouts MUST render a loader for this status (never a blank
 *                  screen).
 * - "allowed"    → user is authenticated and has a permitted role.
 * - "redirecting"→ user is not allowed; a redirect to /login has been
 *                  dispatched. Layouts can render a loader briefly.
 *
 * Redirects happen:
 *   1. Before paint on mount via useLayoutEffect → no flash of protected UI.
 *   2. On every auth-state change (e.g. after logout while mounted).
 *   3. On bfcache restore (pageshow) → full replace so the cached protected
 *      page is dropped and the user lands on /login.
 */
export function useRoleGuard(allowedRoles: Role[]): { status: RoleGuardStatus } {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useLayoutEffect(() => {
    if (isLoading) return;

    const isAllowed = !!user && allowedRoles.includes(user.role);

    if (!isAllowed) {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        router.replace("/login");
      }
    } else {
      redirectedRef.current = false;
    }
  }, [user, isLoading, allowedRoles, router]);

  /* bfcache restore — the component is not remounted on restore, so the effect
     above is skipped.  pageshow fires even for persisted (cached) restores.
     Use a full replace so no cached protected DOM is ever revealed. */
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

  let status: RoleGuardStatus;
  if (isLoading || redirectedRef.current) {
    status = "loading";
  } else if (user && allowedRoles.includes(user.role)) {
    status = "allowed";
  } else {
    status = "redirecting";
  }

  return { status };
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/role.util";

/**
 * The landing page is public, so it must render before the auth bootstrap
 * (`/auth/refresh`) settles. This tiny client boundary owns the redirect for
 * authenticated visitors and renders nothing, keeping the page itself a server
 * component.
 */
export function LandingRedirect(): null {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    router.replace(getRoleHomePath(user.role));
  }, [user, isLoading, router]);

  return null;
}

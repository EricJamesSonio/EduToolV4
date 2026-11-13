"use client";

import { useEffect } from "react";

import { authApi } from "@/api/auth.api";
import { forceLogout, refreshAccessToken } from "@/api/client";
import { useAuthStore } from "@/store/auth.store";

/**
 * Tells the server this page is being left (tab closed, browser closed,
 * hard navigation away). The server starts a short grace timer: a reload
 * refreshes the session within the grace window and carries on, anything
 * else ends the session so the old JWT cannot silently sign the user back in.
 */
export function useSessionClose(): void {
  useEffect(() => {
    const onPageHide = (): void => {
      if (!useAuthStore.getState().accessToken) return;
      authApi.notifySessionClose();
    };

    // Back/forward cache restore: the page was "left" earlier, so re-validate.
    // Inside the grace window this cancels the close; outside it the refresh
    // fails and the user is logged out cleanly.
    const onPageShow = (event: PageTransitionEvent): void => {
      if (!event.persisted) return;
      if (!useAuthStore.getState().accessToken) return;
      refreshAccessToken().catch(() => forceLogout());
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/api/auth.api";

/**
 * Guards the browser back button.
 * Returns dialog state + handlers so a parent component can render a confirm dialog.
 *
 * On popstate:
 *   The guard state is immediately restored (user stays on page).
 *   The confirm dialog is shown.
 *
 * On confirm:
 *   - Calls the logout API (clears server refresh token)
 *   - Clears the in-memory auth store
 *   - Redirects with location.replace (no history entry for the old page)
 */
export function useBackButtonGuard() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const guardedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Push initial guard state so that clicking back hits this state first
    window.history.pushState({ guarded: true }, "");
    guardedRef.current = true;

    const handlePopState = () => {
      // Immediately restore guard to block navigation
      if (guardedRef.current) {
        window.history.pushState({ guarded: true }, "");
        setShowLogoutConfirm(true);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      guardedRef.current = false;
    };
  }, []);

  const handleConfirmLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // swallow — clear local state regardless
    }
    useAuthStore.getState().clearAuth();
    window.location.replace("/login");
  }, []);

  return {
    showLogoutConfirm,
    setShowLogoutConfirm,
    isLoggingOut,
    handleConfirmLogout,
  };
}

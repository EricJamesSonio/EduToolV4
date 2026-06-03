"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { queryClient } from "@/lib/query-client.config";
import { useAuth } from "@/hooks/useAuth";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Guards the browser back button inside authenticated pages.
 *
 * When the user clicks back:
 *   1. The navigation is intercepted (guard state restored immediately)
 *   2. A confirmation dialog appears
 *   3. "Stay" → close dialog, stay on page
 *   4. "Leave" → full logout (backend cookie + local state) and hard redirect
 *
 * Reuses the same logout function as LogoutButton so both paths behave identically.
 *
 * Usage:  <BackButtonGuard />  (one instance per authenticated layout)
 */
export function BackButtonGuard() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const guardedRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.history.pushState({ guarded: true }, "");
    guardedRef.current = true;

    const handlePopState = () => {
      if (guardedRef.current) {
        window.history.pushState({ guarded: true }, "");
        setOpen(true);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      guardedRef.current = false;
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoggingOut(true);
    queryClient.clear();
    await logout();
    window.location.replace("/login");
  }, [logout]);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Leave the page?"
      message={
        <>
          <span className="mb-1 block">
            Going back will log you out of your account.
          </span>
          <span className="text-muted-foreground text-sm">
            You will need to sign in again to continue.
          </span>
        </>
      }
      confirmLabel="Leave &amp; Logout"
      destructive
      isLoading={isLoggingOut}
      onConfirm={handleConfirm}
    />
  );
}

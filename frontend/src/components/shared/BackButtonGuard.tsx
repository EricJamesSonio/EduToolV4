"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Guards the browser back button inside authenticated pages.
 *
 * When the user clicks back:
 *   1. The navigation is intercepted (guard state restored immediately)
 *   2. A confirmation dialog appears
 *   3. "Stay" → close dialog, stay on page
 *   4. "Leave" → clear auth store, replace history with /login (no back-trace)
 *
 * Usage:  <BackButtonGuard />  (one instance per authenticated layout)
 */
export function BackButtonGuard() {
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
    useAuthStore.getState().clearAuth();
    window.location.replace("/login");
  }, []);

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Leave the page?"
      message={
        <>
          <p className="mb-1">
            Going back will log you out of your account.
          </p>
          <p className="text-muted-foreground text-sm">
            You will need to sign in again to continue.
          </p>
        </>
      }
      confirmLabel="Leave &amp; Logout"
      destructive
      isLoading={isLoggingOut}
      onConfirm={handleConfirm}
    />
  );
}

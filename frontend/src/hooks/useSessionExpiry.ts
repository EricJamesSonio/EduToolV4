"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getTokenExpiryMs } from "@/utils/token.util";
import { refreshAccessToken, forceLogout } from "@/api/client";

const REFRESH_BEFORE_MS = 60_000;

export function useSessionExpiry() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const exp = getTokenExpiryMs(accessToken);
    if (!exp) return;

    const refresh = async () => {
      try {
        await refreshAccessToken(); // new token in store, so this effect re-runs
      } catch {
        forceLogout();
      }
    };

    const delay = Math.max(exp - Date.now() - REFRESH_BEFORE_MS, 0);
    const timer = setTimeout(refresh, Math.min(delay, 2 ** 31 - 1));

    // Background tabs and sleeping laptops delay timers, so re-check on return.
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() >= exp - REFRESH_BEFORE_MS
      ) {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [accessToken]);
}
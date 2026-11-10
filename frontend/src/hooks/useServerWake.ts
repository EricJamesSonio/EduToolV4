"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/api.config";

export type WakeStatus = "checking" | "ready";

const WAKE_STORAGE_KEY = "relief-ed:server-awake-at";
const AWAKE_TTL_MS = 10 * 60_000;
const ATTEMPT_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 3_000;

const WAKE_ENABLED = process.env.NEXT_PUBLIC_WAKE_SERVER !== "false";

function recentlyAwake(): boolean {
  try {
    const raw = sessionStorage.getItem(WAKE_STORAGE_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < AWAKE_TTL_MS;
  } catch {
    return false;
  }
}

function markAwake(): void {
  try {
    sessionStorage.setItem(WAKE_STORAGE_KEY, String(Date.now()));
  } catch {
    // storage unavailable, the gate simply shows again on next load
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pingServer(signal: AbortSignal): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal.addEventListener("abort", onAbort);

  try {
    const response = await fetch(`${API_BASE_URL}/check`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", onAbort);
  }
}

/**
 * Pings the backend until it answers, so a sleeping server is awake before
 * the app starts using it. Returns how long the wait has lasted so the UI can
 * explain what is happening.
 */
export function useServerWake(): { status: WakeStatus; elapsedMs: number } {
  const [status, setStatus] = useState<WakeStatus>("checking");
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!WAKE_ENABLED || !API_BASE_URL || recentlyAwake()) {
      setStatus("ready");
      return;
    }

    const controller = new AbortController();
    const startedAt = Date.now();
    const tick = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    const run = async (): Promise<void> => {
      while (!controller.signal.aborted) {
        const awake = await pingServer(controller.signal);
        if (controller.signal.aborted) return;
        if (awake) {
          markAwake();
          setStatus("ready");
          return;
        }
        await sleep(RETRY_DELAY_MS);
      }
    };

    void run().finally(() => clearInterval(tick));

    return () => {
      controller.abort();
      clearInterval(tick);
    };
  }, []);

  return { status, elapsedMs };
}
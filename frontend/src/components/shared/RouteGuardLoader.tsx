"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

const STEPS = [
  "Starting up",
  "Checking your session",
  "Loading your workspace",
] as const;

const STEP_INTERVAL_MS = 2500;
const SLOW_AFTER_MS = 8000;

/**
 * Full-screen loader used by protected layouts while route access is being
 * resolved (session restore, role guard, redirects). Uses the same background
 * as the app so a refresh doesn't flash a different color.
 */
export function RouteGuardLoader({ label }: { label?: string }): React.JSX.Element {
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, STEP_INTERVAL_MS);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      clearInterval(stepTimer);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground"
    >
      <div className="relative flex h-20 w-20 items-center justify-center text-primary">
        <div
          aria-hidden
          className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
        />
        <GraduationCap className="h-8 w-8" strokeWidth={2} />
      </div>

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Relief-ED</h1>
        <p className="text-sm text-muted-foreground">{label ?? `${STEPS[step]}…`}</p>
      </div>

      {slow && (
        <p className="max-w-xs text-xs text-muted-foreground">
          The server is taking longer than usual to wake up. This page will
          continue on its own.
        </p>
      )}
    </div>
  );
}
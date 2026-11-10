"use client";

import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { useServerWake } from "@/hooks/useServerWake";

function wakeMessage(elapsedMs: number): { title: string; hint: string } {
  if (elapsedMs < 6_000) {
    return {
      title: "Waking up the server...",
      hint: "Getting everything ready for you.",
    };
  }
  if (elapsedMs < 25_000) {
    return {
      title: "Waking up the server...",
      hint: "This can take a while sometimes. Thanks for waiting.",
    };
  }
  return {
    title: "Still waking up...",
    hint: "The server can take up to a minute to start after being idle. Hang tight, this page will open on its own.",
  };
}

/**
 * Blocks the app behind a loading screen until the backend is awake, so the
 * first real request (session restore, data) never hits a sleeping server.
 */
export function ServerWakeGate({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  const { status, elapsedMs } = useServerWake();

  if (status === "ready") return <>{children}</>;

  const { title, hint } = wakeMessage(elapsedMs);

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
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Relief-ED
        </h1>
        <p className="text-sm font-medium">{title}</p>
      </div>

      <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
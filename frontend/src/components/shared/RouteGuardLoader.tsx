"use client";

import { Loader2 } from "lucide-react";

/**
 * Full-screen loader used by protected layouts while route access is being
 * resolved. Prevents a blank/white screen flash during session restore or
 * guard redirects.
 */
export function RouteGuardLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

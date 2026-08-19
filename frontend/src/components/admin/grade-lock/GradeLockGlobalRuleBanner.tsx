// ===== File: frontend\src\components\admin\grade-lock\GradeLockGlobalRuleBanner.tsx =====
"use client";

import { format } from "date-fns";
import { Lock } from "lucide-react";

interface GradeLockGlobalRuleBannerProps {
  deadline: string | null | undefined;
}

export function GradeLockGlobalRuleBanner({
  deadline,
}: GradeLockGlobalRuleBannerProps): React.ReactElement | null {
  if (!deadline) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground not-interactive">Global Rule:</span>
      <span className="font-medium">{format(new Date(deadline), "MMM d, yyyy h:mm a")}</span>
    </div>
  );
}
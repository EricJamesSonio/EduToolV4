import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive recipe for list-item cards (School Year, Program, Meeting,
 * Class, Lesson, ...).
 *
 * Density steps down on mobile (<sm) and returns to the original desktop
 * spacing at lg (>=1024px), so every list page that uses these tokens
 * inherits the mobile fix automatically — no per-page overrides.
 *
 * Exported as raw class tokens (so a whole-card <Link> can reuse them)
 * plus a small `ListItemCard` wrapper for the common div case.
 */

export const listItemCardClass =
  "rounded-xl border bg-card p-4 space-y-3 sm:p-5 sm:space-y-4 lg:p-6";

export const listItemTitleClass =
  "font-semibold leading-tight text-base sm:text-lg";

export const listItemIconClass =
  "flex h-9 w-9 items-center justify-center rounded-xl shrink-0 sm:h-10 sm:w-10 lg:h-12 lg:w-12";

export const listItemActionsClass = "flex flex-wrap items-center gap-2";

export function ListItemCard({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return <div className={cn(listItemCardClass, className)} {...props} />;
}

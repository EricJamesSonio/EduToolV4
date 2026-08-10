import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

/**
 * Responsive recipe for list-item cards (School Year, Program, Meeting,
 * Class, Lesson, ...).
 *
 * On phones (<sm) cards are compact (3-up grid, small padding/type, icon-only
 * actions); from sm upward they return to the original spacing, so desktop
 * (>=1024px) renders exactly as before. Every list page that uses these
 * tokens inherits the mobile fix automatically — no per-page overrides.
 *
 * Exported as raw class tokens (so a whole-card <Link> can reuse them)
 * plus a small `ListItemCard` wrapper for the common div case.
 */

export const listItemCardClass =
  "rounded-xl border bg-card p-2.5 space-y-1.5 sm:p-5 sm:space-y-4 lg:p-6";

export const listItemTitleClass =
  "font-semibold leading-tight text-sm sm:text-lg";

export const listItemIconClass =
  "flex h-7 w-7 items-center justify-center rounded-lg shrink-0 sm:h-10 sm:w-10 lg:h-12 lg:w-12";

export const listItemMetaClass = "text-xs sm:text-sm text-muted-foreground";

export const listItemActionsClass = "flex flex-wrap items-center gap-2";

export function ListItemCard({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return <div className={cn(listItemCardClass, className)} {...props} />;
}

interface ListItemCardActionProps
  extends React.ComponentProps<typeof Button> {
  /** Icon shown at all sizes (required unless `mobileLabel` is provided). */
  icon?: LucideIcon;
  /** Full label — shown from `sm` up. Also used as aria-label when icon-only. */
  label: string;
  /** Compact text shown on phones instead of the icon (label-only actions). */
  mobileLabel?: string;
  /** Render the icon at all sizes; keeps `label` as the aria-label. */
  iconOnly?: boolean;
}

/**
 * Compact card action button: icon-only on phones (32px touch target),
 * icon + full label from `sm` up. Pass a `mobileLabel` for actions that
 * carry no icon (e.g. "Request" instead of an icon).
 */
export function ListItemCardAction({
  icon: Icon,
  label,
  mobileLabel,
  iconOnly,
  className,
  variant = "outline",
  ...props
}: ListItemCardActionProps): React.ReactElement {
  const hasIcon = !!Icon;
  return (
    <Button
      variant={variant}
      size={hasIcon ? "icon" : "sm"}
      aria-label={label}
      {...props}
      className={cn(
        iconOnly
          ? ""
          : "sm:size-auto sm:h-7 sm:px-2.5 sm:text-[0.8rem]",
        className
      )}
    >
      {Icon ? (
        <Icon className="h-3.5 w-3.5" />
      ) : (
        <span className="sm:hidden text-xs">{mobileLabel}</span>
      )}
      {!iconOnly && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}

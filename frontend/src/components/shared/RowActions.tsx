"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RowActionButtonProps {
  icon: LucideIcon;
  label: string; // tooltip + screen readers
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function RowActionButton({
  icon: Icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
}: RowActionButtonProps): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 w-8",
        destructive &&
          "text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30",
      )}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

export function RowActions({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="flex items-center gap-1.5">{children}</div>;
}
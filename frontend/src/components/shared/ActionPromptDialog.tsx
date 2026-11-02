"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ICON_TONES, type IconTone } from "@/lib/palette";

interface ActionPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  tone?: IconTone;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isLoading?: boolean;
}

/**
 * Reusable "next step" prompt: icon, title, description, one primary action
 * and a dismiss button. Use it instead of action toasts when the user needs
 * to notice and act on a follow-up.
 */
export function ActionPromptDialog({
  open,
  onOpenChange,
  icon: Icon,
  tone = "blue",
  title,
  description,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel = "Maybe later",
  onSecondary,
  isLoading = false,
}: ActionPromptDialogProps) {
  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className={`icon-container ${ICON_TONES[tone]}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleSecondary}
            disabled={isLoading}
          >
            {secondaryLabel}
          </Button>
          <Button type="button" onClick={onPrimary} disabled={isLoading}>
            {primaryLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
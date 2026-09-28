"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface WelcomeDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function WelcomeDialogShell({
  open,
  onOpenChange,
  children,
}: WelcomeDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">
          <div className="relative h-44 shrink-0 bg-primary/5 sm:h-auto sm:w-[40%]">
            <img
              src="/robot.png"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-popover/50 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-popover/60" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-5 sm:gap-5 sm:overflow-y-auto sm:p-8">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WelcomeHeaderProps {
  icon: LucideIcon;
  title: string;
}

export function WelcomeHeader({ icon: Icon, title }: WelcomeHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <DialogTitle className="text-lg leading-tight font-semibold tracking-tight sm:text-xl">
        {title}
      </DialogTitle>
    </div>
  );
}

export function WelcomeFeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-2.5 text-sm text-muted-foreground"
        >
          <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          {feature}
        </li>
      ))}
    </ul>
  );
}

export function WelcomeActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{children}</div>;
}
"use client";

import { Info } from "lucide-react";
import type { Notification } from "@/store/notification.store";
import { relativeTime } from "@/utils/date.util";
import { cn } from "@/lib/utils";
import { TYPE_ICON } from "./constants";

interface Props {
  notification: Notification;
  onClick: (n: Notification) => void;
}

export function NotificationItem({
  notification: n,
  onClick,
}: Props): React.JSX.Element {
  const Icon = TYPE_ICON[n.type ?? "info"] ?? Info;

  return (
    <button
      type="button"
      onClick={() => onClick(n)}
      className={cn(
        "flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
        !n.isRead && "bg-primary/5",
      )}
    >
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className={cn("break-words", !n.isRead && "font-medium")}>
          {n.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {relativeTime(n.createdAt)}
        </p>
      </div>
      {!n.isRead && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}
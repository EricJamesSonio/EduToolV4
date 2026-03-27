"use client";

import { useNotificationStore } from "@/store/notification.store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Info, AlertCircle, CheckCircle, BookOpen } from "lucide-react";
import { relativeTime } from "@/utils/date.util";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

// Maps notification type → icon
const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  lesson: BookOpen,
};

export function NotificationDropdown() {
  const { notifications, unreadCount } = useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up."
            icon={Bell}
            className="py-8"
          />
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type ?? "info"] ?? Info;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                      !n.isRead && "bg-primary/5"
                    )}
                  >
                    <div className="mt-0.5 shrink-0 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className={cn(!n.isRead && "font-medium")}>
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
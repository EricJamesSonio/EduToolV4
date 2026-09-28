"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useNotificationStore,
  type Notification,
} from "@/store/notification.store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  BookOpen,
  MessageSquare,
  Reply,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { relativeTime } from "@/utils/date.util";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
  useNotificationSummary,
} from "@/hooks/useNotifications";

const TYPE_ICON: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  lesson: BookOpen,
  concern_created: MessageSquare,
  concern_reply: Reply,
  application_submitted: ClipboardList,
};

/**
 * Grouped "totals" rows shown above the individual notifications.
 * Only rows with a non-zero unread count are displayed.
 */
const SUMMARY_ROWS: {
  type: string;
  icon: React.ElementType;
  label: (n: number) => string;
  href: string;
}[] = [
  {
    type: "concern_created",
    icon: MessageSquare,
    label: (n) => `${n} new concern${n === 1 ? "" : "s"} from students`,
    href: "/admin/concerns",
  },
  {
    type: "concern_reply",
    icon: Reply,
    label: (n) => `${n} new repl${n === 1 ? "y" : "ies"} on concerns`,
    href: "/admin/concerns",
  },
  {
    type: "application_submitted",
    icon: ClipboardList,
    label: (n) => `${n} new application form${n === 1 ? "" : "s"}`,
    href: "/admin/enrollment-portal/applications",
  },
];

export function NotificationDropdown(): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Keeps the store in sync with the server (polls every 30s).
  useNotificationFeed();
  const { data: summary } = useNotificationSummary();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const { notifications, unreadCount: storeUnread } = useNotificationStore();

  // Server total is the source of truth (the list only holds the latest page).
  const unreadCount = summary?.unreadCount ?? storeUnread;

  const summaryRows = SUMMARY_ROWS.filter(
    (row) => (summary?.byType?.[row.type] ?? 0) > 0,
  );

  function go(href: string | null): void {
    setOpen(false);
    if (href) router.push(href);
  }

  function handleItemClick(n: Notification): void {
    if (!n.isRead) markRead.mutate(n.id);
    go(n.linkTo);
  }

  const isEmpty = notifications.length === 0 && summaryRows.length === 0;

  return (
    <Popover open={open} onOpenChange={(o) => setOpen(o)}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-9 w-9" />
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {isEmpty ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up."
            icon={Bell}
            className="py-8"
          />
        ) : (
          <ScrollArea className="max-h-90">
            {/* Grouped totals */}
            {summaryRows.length > 0 && (
              <div className="border-b bg-muted/30 p-2">
                <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Needs attention
                </p>
                {summaryRows.map((row) => {
                  const Icon = row.icon;
                  const count = summary?.byType?.[row.type] ?? 0;
                  return (
                    <button
                      key={row.type}
                      type="button"
                      onClick={() => go(row.href)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 font-medium">
                        {row.label(count)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Individual notifications */}
            {notifications.length > 0 && (
              <div className="divide-y">
                {notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type ?? "info"] ?? Info;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleItemClick(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                        !n.isRead && "bg-primary/5",
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
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
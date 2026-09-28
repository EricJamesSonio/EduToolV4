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
import { Bell } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { NotificationList } from "./notification/NotificationList";
import { NotificationSummaryRows } from "./notification/NotificationSummaryRows";
import { SUMMARY_ROWS } from "./notification/constants";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
  useNotificationSummary,
} from "@/hooks/useNotifications";

export function NotificationDropdown(): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const feed = useNotificationFeed();
  const { data: summary } = useNotificationSummary();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const { notifications, unreadCount: storeUnread } = useNotificationStore();

  const unreadCount = summary?.unreadCount ?? storeUnread;

  const hasSummaryRows = SUMMARY_ROWS.some(
    (row) => (summary?.byType?.[row.type] ?? 0) > 0,
  );
  const isEmpty = notifications.length === 0 && !hasSummaryRows;

  function go(href: string | null): void {
    setOpen(false);
    if (href) router.push(href);
  }

  function handleItemClick(n: Notification): void {
    if (!n.isRead) markRead.mutate(n.id);
    go(n.linkTo);
  }

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

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 gap-0 overflow-hidden p-0"
      >
        {/* Header (pinned) */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
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
          <>
            {/* Needs attention (pinned) */}
            <NotificationSummaryRows byType={summary?.byType} onNavigate={go} />

            {/* Only this part scrolls */}
            <NotificationList
              notifications={notifications}
              onItemClick={handleItemClick}
              hasMore={!!feed.hasNextPage}
              isFetchingMore={feed.isFetchingNextPage}
              onLoadMore={() => void feed.fetchNextPage()}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
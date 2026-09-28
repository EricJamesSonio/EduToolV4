"use client";

import { Loader2 } from "lucide-react";
import type { Notification } from "@/store/notification.store";
import { useInfiniteScrollSentinel } from "@/hooks/useInfiniteScrollSentinel";
import { NotificationItem } from "./NotificationItem";

interface Props {
  notifications: Notification[];
  onItemClick: (n: Notification) => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
}

export function NotificationList({
  notifications,
  onItemClick,
  hasMore,
  isFetchingMore,
  onLoadMore,
}: Props): React.JSX.Element | null {
  const { rootRef, sentinelRef } = useInfiniteScrollSentinel({
    enabled: hasMore && !isFetchingMore,
    onReach: onLoadMore,
  });

  if (notifications.length === 0) return null;

  return (
    <div ref={rootRef} className="max-h-72 min-h-0 overflow-y-auto overscroll-contain">
      <div className="divide-y">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onClick={onItemClick} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-3">
          {isFetchingMore && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  );
}
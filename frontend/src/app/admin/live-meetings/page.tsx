"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveMeetingCard } from "@/components/admin/live-meeting/LiveMeetingCard";
import { useLiveMeetings } from "@/hooks/admin/useLiveMeetings";

export default function LiveMeetingsPage() {
  const { data: meetings, isLoading } = useLiveMeetings();
  const list = meetings ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Live Meetings"
        description="Video meetings happening right now. Watch any of them without an invite."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No live meetings right now. This page refreshes automatically.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((meeting) => (
            <LiveMeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
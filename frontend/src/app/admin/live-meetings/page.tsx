"use client";

import { Radio } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { LiveMeetingCard } from "@/components/admin/live-meeting/LiveMeetingCard";
import { useLiveMeetings } from "@/hooks/admin/useLiveMeetings";

export default function LiveMeetingsPage() {
  const { data: meetings, isLoading } = useLiveMeetings();
  const list = meetings ?? [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Live Meetings"
        description="Video meetings happening right now. Watch any of them or join in."
      />

      <AsyncListState
        isLoading={isLoading}
        isError={!isLoading && !meetings}
        isEmpty={list.length === 0}
        errorTitle="We could not load live meetings"
        errorDescription="Check your connection. This page keeps retrying automatically."
        empty={{
          icon: Radio,
          title: "No live meetings right now",
          description:
            "Meetings show up here once someone is in the room. This page refreshes automatically.",
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((meeting) => (
            <LiveMeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </AsyncListState>
    </div>
  );
}
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MeetingCard } from "@/components/educator/meeting/MeetingCard";
import { useMeetings } from "@/hooks/educator/useMeeting";

interface Props {
  params: Promise<{ classId: string }>;
}

export default function MeetingsPage({ params }: Props) {
  const { classId } = use(params);
  const router = useRouter();
  const { data, isLoading } = useMeetings(classId);
  const meetings = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Schedule and join live meetings for this class."
        actions={
          <Button
            onClick={() => router.push(`/educator/classes/${classId}/meetings/new`)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Meeting
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <EmptyState
            icon={Video}
            title="No meetings yet"
            description='Click "+ New Meeting" to schedule your first meeting.'
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} classId={classId} />
          ))}
        </div>
      )}
    </div>
  );
}
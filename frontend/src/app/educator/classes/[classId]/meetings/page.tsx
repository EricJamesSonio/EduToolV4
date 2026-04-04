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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings yet"
          description='Click "+ New Meeting" to schedule your first meeting.'
        />
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} classId={classId} />
          ))}
        </div>
      )}
    </div>
  );
}
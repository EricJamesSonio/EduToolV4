"use client";

import { useRouter } from "next/navigation";
import { PhoneCall, PhoneIncoming } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveMeetingBannerProps {
  classId: string;
  role: "educator" | "student";
  activeMeeting: { meetingId: string; title: string } | null;
}

// Messenger-style active-call strip shown below the chat header while a
// groupy meeting is running. Joining routes to the meeting room.
//
// State depends on who is looking:
//   - Educator (host): the call was started by them, so it is "ongoing" —
//     never "incoming". Shown when they left without ending it.
//   - Student (participant): the call is coming in from the class, so it is
//     "incoming" with a Join action.
export function ActiveMeetingBanner({
  classId,
  role,
  activeMeeting,
}: ActiveMeetingBannerProps): React.JSX.Element | null {
  const router = useRouter();

  if (!activeMeeting) return null;

  const isHost = role === "educator";
  const base = role === "educator" ? "/educator" : "/student";
  const handleJoin = () =>
    router.push(
      `${base}/classes/${classId}/meetings/${activeMeeting.meetingId}/room?origin=groupy`
    );

  return (
    <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isHost ? <PhoneCall className="h-4 w-4" /> : <PhoneIncoming className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-tight text-amber-500">
            {isHost ? "Ongoing call…" : "Incoming call…"}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {activeMeeting.title || "Class Meeting"}
          </p>
        </div>
      </div>
      <Button size="sm" className="shrink-0 gap-1.5" onClick={handleJoin}>
        Join
      </Button>
    </div>
  );
}
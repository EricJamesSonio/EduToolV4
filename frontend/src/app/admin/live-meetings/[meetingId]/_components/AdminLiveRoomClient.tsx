"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLiveMeetings } from "@/hooks/admin/useLiveMeetings";
import { MeetingProvider } from "@/hooks/meeting/MeetingContext";
import { MeetingPreJoin } from "@/components/meeting/MeetingPreJoin";
import { AdminWatchRoom } from "@/components/admin/live-meeting/AdminWatchRoom";
import { AdminJoinedRoom } from "@/components/admin/live-meeting/AdminJoinedRoom";
import { AdminRoomNotice } from "@/components/admin/live-meeting/AdminRoomNotice";

const BACK_HREF = "/admin/live-meetings";

type Stage = "watch" | "lobby" | "joined" | "ended";

function AdminLiveRoom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: liveMeetings } = useLiveMeetings();
  const meeting = liveMeetings?.find((m) => m.id === meetingId) ?? null;

  const [stage, setStage] = useState<Stage>("watch");
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const goBack = useCallback(() => router.push(BACK_HREF), [router]);
  const handleEnded = useCallback(() => setStage("ended"), []);

  const currentUserId = user?.id ?? "";
  const currentUserName = user?.fullName ?? "Admin";

  if (stage === "ended") {
    return (
      <AdminRoomNotice
        icon={PhoneOff}
        title="This meeting has ended"
        description="The room is closed. Pick another live meeting to watch."
        onBack={goBack}
      />
    );
  }

  if (stage === "lobby") {
    return (
      <MeetingPreJoin
        userName={currentUserName}
        roleLabel="Admin"
        onJoin={() => setStage("joined")}
        onCancel={() => setStage("watch")}
      />
    );
  }

  if (stage === "joined") {
    return (
      <AdminJoinedRoom
        meetingId={meetingId}
        meeting={meeting}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onExit={goBack}
        onEnded={handleEnded}
      />
    );
  }

  return (
    <AdminWatchRoom
      key={attempt}
      meetingId={meetingId}
      meeting={meeting}
      currentUserId={currentUserId}
      visible={visible}
      onVisibleChange={setVisible}
      onJoin={() => setStage("lobby")}
      onExit={goBack}
      onEnded={handleEnded}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}

export default function AdminLiveRoomClient(): React.JSX.Element {
  return (
    <MeetingProvider>
      <AdminLiveRoom />
    </MeetingProvider>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMeetingToken } from "@/hooks/student/useStudentMeetings";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import { useChat } from "@/hooks/meeting/useChat";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { useAuthStore } from "@/store/auth.store";
import { useMeetingPresentation } from "@/hooks/meeting/useMeetingPresentation";
import {
  ReactionPicker, ParticipantsPanel, SidePanel,
  VideoGrid, PresentationView, ControlsBar,
  type SidePanelType,
} from "@/components/student/meeting-room";

// ── NEW: import the overlay ───────────────────────────────────────────────────
import { ReactionOverlay } from "@/components/meeting/ReactionOverlay";

export default function StudentMeetingRoomClient(): React.JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const searchParams  = useSearchParams();
  const urlClassId    = searchParams.get("classId") ?? "";
  const router        = useRouter();

  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);
  const meetingClassId = tokenData?.classId ?? "";
  const classId        = meetingClassId || urlClassId;
  const authToken      = useAuthStore.getState().accessToken ?? "";
  const meetingCtx     = useMeetingContext();
  const { user: currentUser } = useAuth();
  const currentUserId   = currentUser?.id ?? "";
  const currentUserName = currentUser?.fullName ?? "You";

  // ── Join / leave ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenData) return;
    if (meetingCtx.isInMeeting && meetingCtx.meetingId === meetingId) {
      meetingCtx.maximize();
    } else {
      meetingCtx.joinMeeting({
        classId, meetingId, role: "student",
        tokenData: {
          appId: tokenData.appId, channel: tokenData.channel,
          token: tokenData.token, uid: tokenData.uid,
        },
        authToken,
      });
    }
    return () => { meetingCtx.minimize(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenData]);

  const { joined, localVideo, remoteUsers, toggleMic, toggleCamera } = meetingCtx;
  const {
    connected, participants, chat, currentSlide, isPresenting, presentationId,
    sendChat, raiseHand, lowerHand, sendReaction,
    // ── NEW ──
    latestReaction, latestHandRaise,
  } = meetingCtx;

  const { presentation, isLoading, isError } = useMeetingPresentation(classId, presentationId);

  const { messages: chatMessages, send: sendChatMessage } = useChat({
    chat, sendChat, currentUserId, currentUserName,
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [handRaised,    setHandRaised]    = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(true);
  const [sidePanel,     setSidePanel]     = useState<SidePanelType>(null);

  // ── Video track replay ────────────────────────────────────────────────────
  useEffect(() => {
    if (!localVideo) return;
    const raf = requestAnimationFrame(() => {
      if (document.getElementById("local-video-pip")) localVideo.play("local-video-pip");
    });
    return () => cancelAnimationFrame(raf);
  }, [localVideo, isPresenting]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      remoteUsers.forEach((user) => {
        if (user.videoTrack) user.videoTrack.play(`remote-${user.uid}`);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [isPresenting, remoteUsers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleMic   = async () => { await toggleMic();    setMicOn((v) => !v); };
  const handleToggleCam   = async () => { await toggleCamera(); setCamOn((v) => !v); };
  const handleToggleHand  = () => { handRaised ? lowerHand() : raiseHand(); setHandRaised((v) => !v); };
  const handleTogglePanel = (panel: NonNullable<SidePanelType>) => setSidePanel((p) => p === panel ? null : panel);

  const handleLeave = () => {
    meetingCtx.leaveMeeting();
    router.push(`/student/classes/${classId}/meetings/${meetingId}`);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (tokenLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Skeleton className="h-8 w-48" />
        <p className="text-sm text-muted-foreground">Connecting to meeting...</p>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">You are not authorized to join this meeting.</p>
        <Button variant="outline" onClick={() => router.push(`/student/classes/${classId}/meetings`)}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      "flex flex-col bg-zinc-950 text-white overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen",
    )}>
      <div className="flex-1 flex overflow-hidden relative">

        {isPresenting ? (
          <PresentationView
            presentation={presentation}
            currentSlide={currentSlide}
            presentationId={presentationId}
            isLoading={isLoading}
            isError={isError}
            remoteUsers={remoteUsers}
            isPresenting={isPresenting}
          />
        ) : (
          <VideoGrid joined={joined} remoteUsers={remoteUsers} />
        )}

        {/* ── Reaction & hand-raise overlay ── */}
        <ReactionOverlay
          incomingEmoji={latestReaction ?? null}
          incomingHandRaise={latestHandRaise ?? null}
        />

        {sidePanel && (
          <SidePanel title={sidePanel} onClose={() => setSidePanel(null)}>
            {sidePanel === "chat" ? (
              <ChatPanel messages={chatMessages} currentUserId={currentUserId} onSend={sendChatMessage} />
            ) : (
              <ParticipantsPanel
  participants={participants}
  remoteUsers={remoteUsers}
  currentUserId={currentUserId}
  currentUserName={currentUserName}
  localVideo={localVideo}
  role="student"
/>
            )}
          </SidePanel>
        )}
      </div>

      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      <ControlsBar
        connected={connected}
        micOn={micOn}
        camOn={camOn}
        handRaised={handRaised}
        isFullscreen={isFullscreen}
        sidePanel={sidePanel}
        participantCount={participants.length}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleHand={handleToggleHand}
        onToggleReactions={() => setShowReactions((v) => !v)}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onToggleSidePanel={handleTogglePanel}
        onLeave={handleLeave}
      />
    </div>
  );
}
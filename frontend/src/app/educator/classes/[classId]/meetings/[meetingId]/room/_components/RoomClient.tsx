"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import { useChat } from "@/hooks/meeting/useChat";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import {
  useMeeting, useMeetingToken, useEnrolledStudents,
  useRespondToJoinRequest, useEndMeeting,
} from "@/hooks/educator/useMeeting";
import type { EnrolledStudent } from "@/types/educator/meeting.types";
import PresentationSelectorModal from "@/components/meeting/PresentationSelectorModal";
import { useMeetingPresentation } from "@/hooks/meeting/useMeetingPresentation";
import type { Presentation } from "@/types/educator/presentation.types";
import {
  ReactionPicker, ParticipantsPanel, JoinRequestsPanel,
  SidePanel, VideoGrid, PresentationView, ControlsBar,
  type SidePanelType,
} from "@/components/educator/meeting-room";

// ── NEW: import the overlay ───────────────────────────────────────────────────
import { ReactionOverlay } from "@/components/meeting/ReactionOverlay";

export default function EducatorMeetingRoomClient(): React.JSX.Element {
  const { classId, meetingId } = useParams<{ classId: string; meetingId: string }>();
  const router = useRouter();

  const { data: meeting }                            = useMeeting(classId, meetingId, { refetchInterval: 10000 });
  const { data: studentsRaw }                        = useEnrolledStudents(classId);
  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);

  const students: EnrolledStudent[] = Array.isArray(studentsRaw) ? studentsRaw : [];
  const authToken                   = getAccessToken() ?? "";
  const meetingCtx                  = useMeetingContext();
  const { user: currentUser }       = useAuth();
  const currentUserId               = currentUser?.id ?? "";
  const currentUserName             = currentUser?.fullName ?? "You";

  // ── Join / leave ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tokenData) return;
    if (meetingCtx.isInMeeting && meetingCtx.meetingId === meetingId) {
      meetingCtx.maximize();
    } else {
      meetingCtx.joinMeeting({
        classId, meetingId, role: "educator",
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
    connected, participants, chat, currentSlide, isPresenting,
    sendChat, raiseHand, lowerHand, sendReaction,
    startPresentation, stopPresentation, changeSlide,
    // ── NEW ──
    latestReaction, latestHandRaise,
  } = meetingCtx;

  const { messages: chatMessages, send: sendChatMessage } = useChat({
    chat, sendChat, currentUserId, currentUserName,
  });

  const respondMutation    = useRespondToJoinRequest(classId, meetingId);
  const endMeetingMutation = useEndMeeting(classId);
  const { presentation, selectPresentation, clearPresentation } = useMeetingPresentation(classId);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [handRaised,    setHandRaised]    = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [sidePanel,     setSidePanel]     = useState<SidePanelType>(null);
  const [showPresModal, setShowPresModal] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(true);

  const pendingRequests = meeting?.joinRequests.filter((r) => r.status === "pending") ?? [];

  // ── Video track replay ────────────────────────────────────────────────────
  useEffect(() => {
    if (!localVideo) return;
    const id  = localExpanded ? "local-video-grid" : "local-video-pip";
    const raf = requestAnimationFrame(() => {
      if (document.getElementById(id)) localVideo.play(id);
    });
    return () => cancelAnimationFrame(raf);
  }, [localVideo, localExpanded, isPresenting]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      remoteUsers.forEach((user) => {
        if (user.videoTrack) user.videoTrack.play(`remote-${user.uid}`);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [isPresenting, remoteUsers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleMic    = async () => { await toggleMic();    setMicOn((v) => !v); };
  const handleToggleCam    = async () => { await toggleCamera(); setCamOn((v) => !v); };
  const handleToggleHand   = () => { handRaised ? lowerHand() : raiseHand(); setHandRaised((v) => !v); };
  const handleTogglePanel  = (panel: NonNullable<SidePanelType>) => setSidePanel((p) => p === panel ? null : panel);
  const handleRespond      = (reqId: string, status: "accepted" | "declined") => respondMutation.mutate({ reqId, status });

  const handleLeave = () => {
    meetingCtx.leaveMeeting();
    router.push(`/educator/classes/${classId}/meetings/${meetingId}`);
  };

  const handleEndMeeting = () => {
    meetingCtx.leaveMeeting();
    endMeetingMutation.mutate(meetingId, {
      onSuccess: () => router.push(`/educator/classes/${classId}/meetings/${meetingId}`),
    });
  };

  const handleSelectPresentation = (pres: Presentation) => {
    selectPresentation(pres);
    startPresentation(pres.id);
  };

  const handleShareScreen = async () => {
    try {
      await meetingCtx.shareScreen();
      setShowPresModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStopPresentation = () => {
    clearPresentation();
    stopPresentation();
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
        <Button variant="outline" onClick={() => router.push(`/educator/classes/${classId}/meetings`)}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      "meeting-room flex flex-col bg-zinc-950 text-white overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen",
    )}>
      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">

        {isPresenting ? (
          <PresentationView
            presentation={presentation}
            currentSlide={currentSlide}
            localExpanded={localExpanded}
            camOn={camOn}
            micOn={micOn}
            onChangeSlide={changeSlide}
            onExpand={() => setLocalExpanded(true)}
          />
        ) : (
          <VideoGrid
            joined={joined}
            camOn={camOn}
            micOn={micOn}
            localExpanded={localExpanded}
            remoteUsers={remoteUsers}
            onExpand={() => setLocalExpanded(true)}
            onCollapse={() => setLocalExpanded(false)}
          />
        )}

        {/* ── Reaction & hand-raise overlay (sits above video, below side panel) ── */}
        <ReactionOverlay
          incomingEmoji={latestReaction ?? null}
          incomingHandRaise={latestHandRaise ?? null}
        />

        {/* Side panel */}
        {sidePanel && (
          <SidePanel
            title={sidePanel === "join-requests" ? "Join Requests" : sidePanel}
            onClose={() => setSidePanel(null)}
          >
            {sidePanel === "chat" ? (
              <ChatPanel messages={chatMessages} currentUserId={currentUserId} onSend={sendChatMessage} />
            ) : sidePanel === "join-requests" ? (
              <JoinRequestsPanel
                requests={pendingRequests}
                students={students}
                onRespond={handleRespond}
                isPending={respondMutation.isPending}
              />
            ) : (
              <ParticipantsPanel participants={participants} />
            )}
          </SidePanel>
        )}

        {/* Pending requests floating badge */}
        {pendingRequests.length > 0 && !sidePanel && (
          <div className="absolute top-3 right-4 z-10">
            <button
              onClick={() => setSidePanel("join-requests")}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-full border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              {pendingRequests.length} request{pendingRequests.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* Reaction picker */}
      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      {/* Controls bar */}
      <ControlsBar
        connected={connected}
        micOn={micOn}
        camOn={camOn}
        handRaised={handRaised}
        isPresenting={isPresenting}
        isFullscreen={isFullscreen}
        showReactions={showReactions}
        sidePanel={sidePanel}
        participantCount={participants.length}
        pendingRequestCount={pendingRequests.length}
        isEndingMeeting={endMeetingMutation.isPending}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleHand={handleToggleHand}
        onToggleReactions={() => setShowReactions((v) => !v)}
        onTogglePresentation={() => isPresenting ? handleStopPresentation() : setShowPresModal(true)}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onToggleSidePanel={handleTogglePanel}
        onLeave={handleLeave}
        onEnd={handleEndMeeting}
      />

      <PresentationSelectorModal
        open={showPresModal}
        onClose={() => setShowPresModal(false)}
        onSelect={handleSelectPresentation}
        onShareScreen={handleShareScreen}
        classId={classId}
      />
    </div>
  );
}
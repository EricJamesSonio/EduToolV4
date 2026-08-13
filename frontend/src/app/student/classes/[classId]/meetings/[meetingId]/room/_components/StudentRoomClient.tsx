"use client";

import { useEffect, useRef, useState } from "react";
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
import { MeetingOverflowSheet } from "@/components/meeting/MeetingOverflowSheet";
import { Hand, MessageSquare, Presentation, Users, Smile, Maximize, Minimize } from "lucide-react";

// ── NEW: import the overlay ───────────────────────────────────────────────────
import { ReactionOverlay } from "@/components/meeting/ReactionOverlay";
import { groupyApi } from "@/api/shared/groupy.api";

export default function StudentMeetingRoomClient(): React.JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const searchParams  = useSearchParams();
  const urlClassId    = searchParams.get("classId") ?? "";
  const router        = useRouter();

  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);
  const meetingClassId = tokenData?.classId ?? "";
  const classId        = meetingClassId || urlClassId;
  // Groupy-launched rooms return to the class chat instead of the meetings page
  // (groupy meetings are ephemeral and never listed there).
  const isGroupyRoom   = searchParams.get("origin") === "groupy";
  const backUrl        = isGroupyRoom
    ? `/student/classes/${classId}/groupy`
    : `/student/classes/${classId}/meetings/${meetingId}`;
  const authToken      = useAuthStore.getState().accessToken ?? "";
  const meetingCtx     = useMeetingContext();
  const { user: currentUser } = useAuth();
  const currentUserId   = currentUser?.id ?? "";
  const currentUserName = currentUser?.fullName ?? "You";

  // ── Join / leave ──────────────────────────────────────────────────────────
  const didClearStale = useRef(false);

  useEffect(() => {
    if (!tokenData) return;
    if (meetingCtx.isInMeeting && meetingCtx.meetingId === meetingId) {
      meetingCtx.maximize();
      // Clear stale reaction/hand-raise state only once per mount, when
      // re-entering an already-running meeting. Guarded so a token refetch
      // (e.g. on reconnect) can't wipe freshly-arrived reactions mid-session.
      if (!didClearStale.current) {
        didClearStale.current = true;
        meetingCtx.clearEphemeralState();
      }
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
  const [overflowOpen,  setOverflowOpen]  = useState(false);
  const [mobileSlidesOpen, setMobileSlidesOpen] = useState(false);
  const [featuredUid,   setFeaturedUid]   = useState<string | number | null>(null);

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
  }, [isPresenting, featuredUid, remoteUsers]);

  // If the promoted participant leaves, exit "featured".
  useEffect(() => {
    if (featuredUid == null) return;
    if (!remoteUsers.some((u) => String(u.uid) === String(featuredUid))) {
      setFeaturedUid(null);
    }
  }, [remoteUsers, featuredUid]);

  // ── Groupy rooms: trip back to the class chat when the meeting ends ───────
  // Ephemeral meetings are hard-deleted once the host ends them / everyone
  // leaves, so confirmed "no active meeting" returns us to the chat — no
  // blank screen or manual navigation for participants.
  const exitedToChatRef = useRef(false);
  useEffect(() => {
    if (!isGroupyRoom) return;
    let disposed = false;
    const check = async () => {
      if (!meetingCtx.joined || exitedToChatRef.current) return;
      try {
        const data = await groupyApi.getActiveMeeting(classId);
        if (disposed || exitedToChatRef.current) return;
        if (!data.meeting || data.meeting.meetingId !== meetingId) {
          exitedToChatRef.current = true;
          router.push(backUrl);
        }
      } catch {
        // transient network error — keep polling
      }
    };
    const id = setInterval(check, 4000);
    return () => {
      disposed = true;
      clearInterval(id);
    };
  }, [isGroupyRoom, classId, meetingId, backUrl, router, meetingCtx.joined]);

  // ── Host ended the meeting: force-exit immediately ────────────────────────
  // The backend broadcasts "meeting:ended" through the socket the moment the
  // end call succeeds, so every connected client leaves the room right away
  // instead of waiting for the next poll tick.
  useEffect(() => {
    if (!meetingCtx.meetingEnded || exitedToChatRef.current) return;
    exitedToChatRef.current = true;
    meetingCtx.leaveMeeting();
    router.push(backUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingCtx.meetingEnded, backUrl]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleMic   = async () => { await toggleMic();    setMicOn((v) => !v); };
  const handleToggleCam   = async () => { await toggleCamera(); setCamOn((v) => !v); };
  const handleToggleHand  = () => { handRaised ? lowerHand() : raiseHand(); setHandRaised((v) => !v); };
  const handleTogglePanel = (panel: NonNullable<SidePanelType>) =>
    setSidePanel((p) => (p === panel ? null : isGroupyRoom && panel !== "participants" ? p : panel));

  const handleLeave = () => {
    exitedToChatRef.current = true;
    meetingCtx.leaveMeeting();
    router.push(backUrl);
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
        <Button variant="outline" onClick={() => router.push(backUrl)}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn(
      "flex flex-col bg-background text-foreground overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen",
    )}>
      <div className="flex-1 flex overflow-hidden relative bg-zinc-950">

        {isPresenting && !isGroupyRoom ? (
          <PresentationView
            presentation={presentation}
            currentSlide={currentSlide}
            presentationId={presentationId}
            isLoading={isLoading}
            isError={isError}
            remoteUsers={remoteUsers}
            isPresenting={isPresenting}
            mobileSlidesOpen={mobileSlidesOpen}
            onCloseMobileSlides={() => setMobileSlidesOpen(false)}
            featuredUid={featuredUid}
            onPromote={(uid) => setFeaturedUid(uid)}
            onExitFeatured={() => setFeaturedUid(null)}
            isFullscreen={isFullscreen}
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
            {!isGroupyRoom && sidePanel === "chat" ? (
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

      <MeetingOverflowSheet
        open={overflowOpen}
        onClose={() => setOverflowOpen(false)}
        actions={[
          ...(isPresenting && !isGroupyRoom
            ? [{
                key: "slides",
                label: "Slides",
                icon: Presentation,
                onClick: () => {
                  setOverflowOpen(false);
                  setMobileSlidesOpen(true);
                },
              }]
            : []),
          ...(isGroupyRoom
            ? []
            : [{
                key: "chat",
                label: "Chat",
                icon: MessageSquare,
                active: sidePanel === "chat",
                onClick: () => {
                  setOverflowOpen(false);
                  handleTogglePanel("chat");
                },
              }]),
          {
            key: "participants",
            label: participants.length > 0 ? `${participants.length}` : "People",
            icon: Users,
            active: sidePanel === "participants",
            onClick: () => {
              setOverflowOpen(false);
              handleTogglePanel("participants");
            },
          },
          {
            key: "reactions",
            label: "React",
            icon: Smile,
            active: showReactions,
            onClick: () => {
              setOverflowOpen(false);
              setShowReactions((v) => !v);
            },
          },
          {
            key: "hand",
            label: handRaised ? "Lower" : "Hand",
            icon: Hand,
            active: handRaised,
            onClick: () => {
              setOverflowOpen(false);
              handleToggleHand();
            },
          },
          {
            key: "fullscreen",
            label: isFullscreen ? "Exit Full" : "Fullscreen",
            icon: isFullscreen ? Minimize : Maximize,
            onClick: () => {
              setOverflowOpen(false);
              setIsFullscreen((v) => !v);
            },
          },
        ]}
      />

      <ControlsBar
        connected={connected}
        micOn={micOn}
        camOn={camOn}
        handRaised={handRaised}
        isFullscreen={isFullscreen}
        overflowOpen={overflowOpen}
        sidePanel={sidePanel}
        participantCount={participants.length}
        simplified={isGroupyRoom}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleHand={handleToggleHand}
        onToggleReactions={() => setShowReactions((v) => !v)}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onToggleSidePanel={handleTogglePanel}
        onToggleOverflow={() => setOverflowOpen((v) => !v)}
        onLeave={handleLeave}
      />
    </div>
  );
}
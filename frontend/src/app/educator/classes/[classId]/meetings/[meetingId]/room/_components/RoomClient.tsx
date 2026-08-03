// src/app/educator/classes/[classId]/meetings/[meetingId]/room/_components/RoomClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
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
import { MeetingOverflowSheet } from "@/components/meeting/MeetingOverflowSheet";
import {
  Hand, MessageSquare, Monitor, Users, UserPlus, Smile, Maximize, Minimize, Presentation as PresentationIcon,
} from "lucide-react";
import { ReactionOverlay } from "@/components/meeting/ReactionOverlay";
import { useMeetingAttendance } from "@/hooks/meeting/useMeetingAttendance";
import { AttendanceSummaryPanel } from "@/components/educator/meeting-room/AttendanceSummaryPanel";
import { saveAttendance } from "@/utils/meetingAttendanceStorage";

export default function EducatorMeetingRoomClient(): React.JSX.Element {
  const { classId, meetingId } = useParams<{ classId: string; meetingId: string }>();
  const router = useRouter();

  const { data: meeting }                            = useMeeting(classId, meetingId, { refetchInterval: 10000 });
  const { data: studentsRaw }                        = useEnrolledStudents(classId);
  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);

  const students: EnrolledStudent[] = Array.isArray(studentsRaw) ? studentsRaw : [];
  const authToken                   = useAuthStore.getState().accessToken ?? "";
  const meetingCtx                  = useMeetingContext();
  const { user: currentUser }       = useAuth();
  const currentUserId               = currentUser?.id ?? "";
  const currentUserName             = currentUser?.fullName ?? "You";

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
    latestReaction, latestHandRaise,
  } = meetingCtx;

  // ── Attendance tracking ───────────────────────────────────────────────────
  const { records, formatDuration, flushSessions } = useMeetingAttendance(participants);
  const [meetingEnded, setMeetingEnded] = useState(false);

  const { messages: chatMessages, send: sendChatMessage } = useChat({
    chat, sendChat, currentUserId, currentUserName,
  });

  const respondMutation    = useRespondToJoinRequest(classId, meetingId);
  const endMeetingMutation = useEndMeeting(classId);
  const { presentation, selectPresentation, clearPresentation } = useMeetingPresentation(classId, meetingCtx.presentationId);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [micOn,         setMicOn]         = useState(true);
  const [camOn,         setCamOn]         = useState(true);
  const [handRaised,    setHandRaised]    = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [sidePanel,     setSidePanel]     = useState<SidePanelType>(null);
  const [showPresModal, setShowPresModal] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [isFullscreen,  setIsFullscreen]  = useState(true);
  const [overflowOpen,  setOverflowOpen]  = useState(false);
  const [mobileSlidesOpen, setMobileSlidesOpen] = useState(false);
  const [featuredUid,   setFeaturedUid]   = useState<string | number | null>(null);

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
  }, [isPresenting, featuredUid, remoteUsers]);

  // If the promoted participant leaves, exit "featured" so the main monitor
  // isn't left pointing at a dead element.
  useEffect(() => {
    if (featuredUid == null) return;
    if (!remoteUsers.some((u) => String(u.uid) === String(featuredUid))) {
      setFeaturedUid(null);
    }
  }, [remoteUsers, featuredUid]);

  // ── Shared exit: flush sessions, persist, then navigate ──────────────────
  // flushSessions() does an async setState, so we capture the flushed totals
  // by computing them inline here before calling it, then save immediately.
  function finalizeAndSave() {
    // Compute flushed records manually so we don't depend on async setState
    const now = Date.now();
    const flushedRecords = records.map((r) => {
      const hasOpenSession = r.sessions.some((s) => s.leftAt === 0);
      if (!hasOpenSession) return r;

      const extra = r.sessions
        .filter((s) => s.leftAt === 0)
        .reduce((sum, s) => sum + Math.round((now - s.joinedAt) / 1000), 0);

      return {
        ...r,
        totalSeconds: r.totalSeconds + extra,
        sessions: r.sessions.map((s) =>
          s.leftAt === 0 ? { ...s, leftAt: now } : s
        ),
      };
    });

    saveAttendance(meetingId, flushedRecords);
    flushSessions();
    setMeetingEnded(true);
    setSidePanel("participants");
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleMic   = async () => { await toggleMic();    setMicOn((v) => !v); };
  const handleToggleCam   = async () => { await toggleCamera(); setCamOn((v) => !v); };
  const handleToggleHand  = () => { handRaised ? lowerHand() : raiseHand(); setHandRaised((v) => !v); };
  const handleTogglePanel = (panel: NonNullable<SidePanelType>) => setSidePanel((p) => p === panel ? null : panel);
  const handleRespond     = (reqId: string, status: "accepted" | "declined") => respondMutation.mutate({ reqId, status });

  const handleLeave = () => {
    finalizeAndSave();
    meetingCtx.leaveMeeting();
    router.push(`/educator/classes/${classId}/meetings/${meetingId}`);
  };

  const handleEndMeeting = () => {
    finalizeAndSave();
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
      "meeting-room flex flex-col bg-background text-foreground overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen",
    )}>
      <div className="flex-1 flex overflow-hidden relative min-h-0 bg-zinc-950">

        {isPresenting ? (
          <PresentationView
            presentation={presentation}
            currentSlide={currentSlide}
            localExpanded={localExpanded}
            camOn={camOn}
            micOn={micOn}
            mobileSlidesOpen={mobileSlidesOpen}
            onCloseMobileSlides={() => setMobileSlidesOpen(false)}
            onChangeSlide={changeSlide}
            onExpand={() => setLocalExpanded(true)}
            remoteUsers={remoteUsers}
            featuredUid={featuredUid}
            onPromote={(uid) => setFeaturedUid(uid)}
            onExitFeatured={() => setFeaturedUid(null)}
            isFullscreen={isFullscreen}
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

        <ReactionOverlay
          incomingEmoji={latestReaction ?? null}
          incomingHandRaise={latestHandRaise ?? null}
        />

        {sidePanel && (
          <SidePanel
            title={
              sidePanel === "join-requests"                  ? "Join Requests"
              : sidePanel === "participants" && meetingEnded ? "Attendance Summary"
              : sidePanel
            }
            onClose={() => setSidePanel(null)}
          >
            {sidePanel === "chat" ? (
              <ChatPanel
                messages={chatMessages}
                currentUserId={currentUserId}
                onSend={sendChatMessage}
              />
            ) : sidePanel === "join-requests" ? (
              <JoinRequestsPanel
                requests={pendingRequests}
                students={students}
                onRespond={handleRespond}
                isPending={respondMutation.isPending}
              />
            ) : sidePanel === "participants" && meetingEnded ? (
              <AttendanceSummaryPanel
                records={records}
                formatDuration={formatDuration}
              />
            ) : (
              <ParticipantsPanel
                participants={participants}
                remoteUsers={remoteUsers}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                localVideo={localVideo}
                role="educator"
              />
            )}
          </SidePanel>
        )}

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

      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      <MeetingOverflowSheet
        open={overflowOpen}
        onClose={() => setOverflowOpen(false)}
        actions={[
          ...(isPresenting
            ? [{
                key: "slides",
                label: "Slides",
                icon: PresentationIcon,
                onClick: () => {
                  setOverflowOpen(false);
                  setMobileSlidesOpen(true);
                },
              }]
            : []),
          {
            key: "present",
            label: isPresenting ? "Stop" : "Present",
            icon: Monitor,
            active: isPresenting,
            onClick: () => {
              setOverflowOpen(false);
              if (isPresenting) {
                handleStopPresentation();
              } else {
                setShowPresModal(true);
              }
            },
          },
          {
            key: "chat",
            label: "Chat",
            icon: MessageSquare,
            active: sidePanel === "chat",
            onClick: () => {
              setOverflowOpen(false);
              handleTogglePanel("chat");
            },
          },
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
            key: "join-requests",
            label: "Requests",
            icon: UserPlus,
            active: sidePanel === "join-requests",
            badge: pendingRequests.length,
            onClick: () => {
              setOverflowOpen(false);
              handleTogglePanel("join-requests");
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
        isPresenting={isPresenting}
        isFullscreen={isFullscreen}
        showReactions={showReactions}
        overflowOpen={overflowOpen}
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
        onToggleOverflow={() => setOverflowOpen((v) => !v)}
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
// src/app/educator/classes/[classId]/meetings/[meetingId]/room/_components/RoomClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { groupyApi } from "@/api/shared/groupy.api";

export default function EducatorMeetingRoomClient(): React.JSX.Element {
  const { classId, meetingId } = useParams<{ classId: string; meetingId: string }>();
  const router = useRouter();

  // Groupy-launched rooms return to the class chat instead of the meetings page
  // (groupy meetings are ephemeral and never listed there).
  const isGroupyRoom =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("origin") === "groupy";
  const backUrl = isGroupyRoom
    ? `/educator/classes/${classId}/groupy`
    : `/educator/classes/${classId}/meetings/${meetingId}`;

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
        origin: isGroupyRoom ? "groupy" : "scheduled",
      });
    }
    return () => { meetingCtx.minimize(); };
  }, [tokenData]);

  const { joined, localVideo, remoteUsers, toggleMic, toggleCamera } = meetingCtx;
  const {
    connected, participants, chat, currentSlide, isPresenting,
    sendChat, raiseHand, lowerHand, sendReaction,
    startPresentation, stopPresentation, changeSlide,
    latestReaction, latestHandRaise,
  } = meetingCtx;

  // ── Groupy rooms: trip back to the class chat when the meeting ends ───────
  // Ephemeral meetings are hard-deleted the moment everyone leaves / the host
  // ends them, so once "no active meeting" is confirmed the client returns to
  // the chat automatically — no blank screen or manual navigation.
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
  // The backend broadcasts "meeting:ended" through the socket as soon as the
  // end call succeeds, so every connected client (host + students) leaves the
  // room now instead of waiting for the next poll tick.
  useEffect(() => {
    if (!meetingCtx.meetingEnded || exitedToChatRef.current) return;
    exitedToChatRef.current = true;
    finalizeAndSave();
    meetingCtx.leaveMeeting();
    router.push(backUrl);

  }, [meetingCtx.meetingEnded, backUrl]);

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
  const handleToggleHand  = () => { if (handRaised) lowerHand(); else raiseHand(); setHandRaised((v) => !v); };
  const handleTogglePanel = (panel: NonNullable<SidePanelType>) =>
    setSidePanel((p) => (p === panel ? null : isGroupyRoom && panel !== "participants" ? p : panel));
  const handleRespond     = (reqId: string, status: "accepted" | "declined") => respondMutation.mutate({ reqId, status });

  const handleToggleFullscreen = () => {
    if (isGroupyRoom) {
      // Groupy meetings started from the class chat: exiting fullscreen
      // returns to the chat with the call minimized (mini player keeps the
      // camera live). For regular meetings the button only toggles the
      // fullscreen overlay.
      meetingCtx.minimize();
      router.push(backUrl);
    } else {
      setIsFullscreen((v) => !v);
    }
  };

  const handleLeave = () => {
    exitedToChatRef.current = true;
    finalizeAndSave();
    meetingCtx.leaveMeeting();
    router.push(backUrl);
  };

  const handleEndMeeting = () => {
    exitedToChatRef.current = true;
    finalizeAndSave();
    // End the meeting first, then disconnect. Disconnecting before the end
    // request can hard-delete an ephemeral Groupy meeting the moment the room
    // empties, which makes the end call below 404 on an already-gone meeting.
    endMeetingMutation.mutate(meetingId, {
      onSuccess: () => {
        meetingCtx.leaveMeeting();
        router.push(backUrl);
      },
      onError: (err) => {
        // A 404 means the meeting is already gone (e.g. cleaned up when the
        // room emptied) — effectively ended, so exit silently.
        if ((err as { response?: { status?: number } })?.response?.status === 404) {
          meetingCtx.leaveMeeting();
          router.push(backUrl);
          return;
        }
        console.error("End meeting failed:", err);
        toast.error("Failed to end the meeting. Please try again.");
        meetingCtx.leaveMeeting();
        router.push(backUrl);
      },
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
        <Button variant="outline" onClick={() => router.push(backUrl)}>
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

        {isPresenting && !isGroupyRoom ? (
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
              !isGroupyRoom && sidePanel === "join-requests"    ? "Join Requests"
              : !isGroupyRoom && sidePanel === "participants" && meetingEnded ? "Attendance Summary"
              : sidePanel
            }
            onClose={() => setSidePanel(null)}
          >
            {isGroupyRoom ? (
              <ParticipantsPanel
                participants={participants}
                remoteUsers={remoteUsers}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                localVideo={localVideo}
                role="educator"
              />
            ) : sidePanel === "chat" ? (
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

        {pendingRequests.length > 0 && !sidePanel && !isGroupyRoom && (
          <div className="absolute top-3 right-4 z-10">
            <button
              onClick={() => setSidePanel("join-requests")}
              className="flex items-center gap-1.5 bg-[#FDE68A] text-[#0B1E3A] text-xs px-3 py-1.5 rounded-full border border-[#FCD34D] hover:bg-[#FDE68A]/90 transition-colors"
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
          ...(isPresenting && !isGroupyRoom
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
          ...(isGroupyRoom
            ? []
            : [{
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
              }]),
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
          ...(isGroupyRoom
            ? []
            : [{
                key: "join-requests",
                label: "Requests",
                icon: UserPlus,
                active: sidePanel === "join-requests",
                badge: pendingRequests.length,
                onClick: () => {
                  setOverflowOpen(false);
                  handleTogglePanel("join-requests");
                },
              }]),
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
        simplified={isGroupyRoom}
        onToggleMic={handleToggleMic}
        onToggleCam={handleToggleCam}
        onToggleHand={handleToggleHand}
        onToggleReactions={() => setShowReactions((v) => !v)}
        onTogglePresentation={() => !isGroupyRoom && (isPresenting ? handleStopPresentation() : setShowPresModal(true))}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleSidePanel={handleTogglePanel}
        onToggleOverflow={() => setOverflowOpen((v) => !v)}
        onLeave={handleLeave}
        onEnd={handleEndMeeting}
      />

      {!isGroupyRoom && (
        <PresentationSelectorModal
          open={showPresModal}
          onClose={() => setShowPresModal(false)}
          onSelect={handleSelectPresentation}
          onShareScreen={handleShareScreen}
          classId={classId}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Hand, MessageSquare,
  Users, LogOut, Smile, UserPlus, Check, X,
  Maximize, Minimize, Monitor,
} from "lucide-react";
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
import PresentationOverlay from "@/components/meeting/PresentationOverlay";
import { useMeetingPresentation } from "@/hooks/meeting/useMeetingPresentation";
import type { Presentation } from "@/types/educator/presentation.types";
import PipVideo from "./PipVideo";

const REACTIONS = ["👍", "👏", "❤️", "😂", "😮", "🎉"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReactionPicker({ onPick, onClose }: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="meeting-reaction-picker absolute bottom-16 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-xl px-3 py-2 flex gap-2 shadow-lg z-20">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onPick(emoji); onClose(); }}
          className="text-2xl hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ParticipantsPanel({ participants }: {
  participants: { userId: string; name: string; role: string; handRaised: boolean }[];
}) {
  return (
    <div className="p-3 space-y-1 overflow-y-auto h-full">
      {participants.map((p) => (
        <div key={p.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {p.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{p.name}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{p.role}</p>
          </div>
          {p.handRaised && <span className="text-base">✋</span>}
        </div>
      ))}
    </div>
  );
}

function JoinRequestsPanel({ requests, students, onRespond, isPending }: {
  requests: { id: string; studentId: string }[];
  students: EnrolledStudent[];
  onRespond: (reqId: string, status: "accepted" | "declined") => void;
  isPending: boolean;
}) {
  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No pending join requests
      </div>
    );
  }
  return (
    <div className="p-3 space-y-2 overflow-y-auto h-full">
      {requests.map((req) => {
        const student = students.find((s) => s.id === req.studentId);
        return (
          <div key={req.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{student?.fullName ?? req.studentId}</p>
              {student?.email && (
                <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => onRespond(req.id, "accepted")}
                disabled={isPending}
                className="h-7 w-7 flex items-center justify-center rounded-md text-green-600 hover:bg-green-500/10 transition-colors disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => onRespond(req.id, "declined")}
                disabled={isPending}
                className="h-7 w-7 flex items-center justify-center rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LocalVideoGrid({ camOn, micOn, onCollapse }: {
  camOn: boolean;
  micOn: boolean;
  onCollapse: () => void;
}) {
  return (
    <div
      id="local-video-grid"
      className="rounded-lg bg-zinc-800 w-full min-h-[200px] border border-zinc-700 overflow-hidden relative"
    >
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none">
          <VideoOff className="h-6 w-6" />
        </div>
      )}
      <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-2 bg-gradient-to-b from-black/50 to-transparent z-10">
        <span className="text-xs text-zinc-300">Your Camera</span>
        <button
          onClick={onCollapse}
          className="h-6 w-6 flex items-center justify-center rounded-md bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded pointer-events-none z-10">
        You {micOn ? "" : "🔇"}
      </div>
    </div>
  );
}

// ─── ControlButton ────────────────────────────────────────────────────────────

function ControlBtn({
  onClick, active, danger, disabled, label, hideOnMobile = false, children,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  hideOnMobile?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "meeting-ctrl-btn flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50",
        active  && !danger && "text-primary bg-primary/10",
        danger  && "text-red-400 hover:bg-red-900/30",
        !active && !danger && "text-zinc-300 hover:bg-zinc-800",
        hideOnMobile && "meeting-ctrl-btn--hide-mobile",
      )}
    >
      {children}
      <span className="meeting-ctrl-label text-[10px] leading-none whitespace-nowrap">{label}</span>
    </button>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────

function SidePanel({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="meeting-side-panel border-l border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <span className="text-sm font-medium capitalize">{title}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
        classId,
        meetingId,
        role: "educator",
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
  const [sidePanel,     setSidePanel]     = useState<"chat" | "participants" | "join-requests" | null>(null);
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
  const handleToggleMic  = async () => { await toggleMic();    setMicOn((v) => !v); };
  const handleToggleCam  = async () => { await toggleCamera(); setCamOn((v) => !v); };
  const handleToggleHand = () => { handRaised ? lowerHand() : raiseHand(); setHandRaised((v) => !v); };

  const handleRespond = (reqId: string, status: "accepted" | "declined") =>
    respondMutation.mutate({ reqId, status });

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

        {/* ── Presentation mode ──────────────────────────────────────────── */}
        {isPresenting ? (
          <div className="flex-1 relative overflow-hidden">
            <PresentationOverlay
              presentation={presentation}
              currentSlideIndex={currentSlide}
              onChangeSlide={changeSlide}
            />
            {!localExpanded && (
              <PipVideo
                videoId="local-video-pip"
                camOn={camOn}
                micOn={micOn}
                zClass="z-20"
                onExpand={() => setLocalExpanded(true)}
              />
            )}
          </div>

        ) : (
        /* ── Grid mode ─────────────────────────────────────────────────── */
          <div className="flex-1 relative overflow-hidden">
            <div className={cn(
              "h-full grid gap-1 p-1",
              // On mobile always single column; on larger screens adapt to user count
              localExpanded
                ? "grid-cols-1 sm:grid-cols-2"
                : remoteUsers.length === 0
                  ? "place-items-center"
                  : "grid-cols-1 sm:grid-cols-2",
            )}>
              {!localExpanded && remoteUsers.length === 0 && !joined && (
                <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
              )}
              {localExpanded && (
                <LocalVideoGrid
                  camOn={camOn}
                  micOn={micOn}
                  onCollapse={() => setLocalExpanded(false)}
                />
              )}
              {remoteUsers.map((user) => (
                <div
                  key={String(user.uid)}
                  id={`remote-${user.uid}`}
                  className="rounded-lg bg-zinc-800 w-full h-full min-h-[160px]"
                />
              ))}
            </div>

            {!localExpanded && (
              <PipVideo
                videoId="local-video-pip"
                camOn={camOn}
                micOn={micOn}
                zClass="z-10"
                onExpand={() => setLocalExpanded(true)}
              />
            )}
          </div>
        )}

        {/* ── Side panel — full-width sheet on mobile, fixed sidebar on desktop ── */}
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

        {/* ── Pending requests floating badge ── */}
        {pendingRequests.length > 0 && !sidePanel && (
          <div className="absolute top-3 right-4 z-10">
            <button
              onClick={() => setSidePanel("join-requests")}
              className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-full border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {pendingRequests.length} request{pendingRequests.length > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* ── Reaction picker ── */}
      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      {/* ── Controls bar ── */}
      <div className="meeting-controls relative shrink-0 flex items-center justify-center flex-wrap gap-1 border-t border-zinc-800 bg-zinc-900 px-2 py-1">
        {/* Connection status */}
        <div className={cn(
          "meeting-status absolute left-3 flex items-center gap-1.5 text-[10px]",
          connected ? "text-emerald-400" : "text-zinc-500",
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", connected ? "bg-emerald-400" : "bg-zinc-500")} />
          <span className="meeting-status-label">{connected ? "Connected" : "Connecting..."}</span>
        </div>

        <ControlBtn onClick={handleToggleMic} active={!micOn} danger={!micOn} label={micOn ? "Mute" : "Unmute"}>
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </ControlBtn>

        <ControlBtn onClick={handleToggleCam} active={!camOn} danger={!camOn} label={camOn ? "Stop Video" : "Start Video"}>
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </ControlBtn>

        <ControlBtn
          onClick={handleToggleHand}
          active={handRaised}
          label={handRaised ? "Lower Hand" : "Raise Hand"}
          hideOnMobile
        >
          <Hand className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn onClick={() => setShowReactions((v) => !v)} label="React" hideOnMobile>
          <Smile className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn
          onClick={() => isPresenting ? handleStopPresentation() : setShowPresModal(true)}
          active={isPresenting}
          label={isPresenting ? "Stop" : "Present"}
        >
          <Monitor className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn
          onClick={() => setSidePanel((p) => p === "chat" ? null : "chat")}
          active={sidePanel === "chat"}
          label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn
          onClick={() => setIsFullscreen((v) => !v)}
          active={isFullscreen}
          label={isFullscreen ? "Exit Full" : "Fullscreen"}
          hideOnMobile
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </ControlBtn>

        <ControlBtn
          onClick={() => setSidePanel((p) => p === "participants" ? null : "participants")}
          active={sidePanel === "participants"}
          label={participants.length > 0 ? `${participants.length}` : "People"}
          hideOnMobile
        >
          <Users className="h-5 w-5" />
        </ControlBtn>

        <div className="relative">
          <ControlBtn
            onClick={() => setSidePanel((p) => p === "join-requests" ? null : "join-requests")}
            active={sidePanel === "join-requests"}
            label="Requests"
            hideOnMobile
          >
            <UserPlus className="h-5 w-5" />
          </ControlBtn>
          {pendingRequests.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950 pointer-events-none">
              {pendingRequests.length}
            </span>
          )}
        </div>

        <ControlBtn onClick={handleLeave} label="Leave">
          <LogOut className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn
          onClick={handleEndMeeting}
          disabled={endMeetingMutation.isPending}
          danger
          label={endMeetingMutation.isPending ? "Ending..." : "End"}
        >
          <LogOut className="h-5 w-5" />
        </ControlBtn>
      </div>

      <PresentationSelectorModal
        open={showPresModal}
        onClose={() => setShowPresModal(false)}
        onSelect={handleSelectPresentation}
        classId={classId}
      />
    </div>
  );
}
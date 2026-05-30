"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

const REACTIONS = ["👍", "👏", "❤️", "😂", "😮", "🎉"];

function ReactionPicker({ onPick, onClose }: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-xl px-3 py-2 flex gap-2 shadow-lg z-20">
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
    <div className="p-3 space-y-1 overflow-y-auto">
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
    <div className="p-3 space-y-2 overflow-y-auto">
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

export default function EducatorMeetingRoomClient(): React.JSX.Element {
  const { classId, meetingId } = useParams<{ classId: string; meetingId: string }>();
  const router = useRouter();

  const { data: meeting } = useMeeting(classId, meetingId, { refetchInterval: 10000 });
  const { data: studentsRaw } = useEnrolledStudents(classId);
  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);

  const students: EnrolledStudent[] = Array.isArray(studentsRaw) ? studentsRaw : [];
  const authToken = getAccessToken() ?? "";
  const meetingCtx = useMeetingContext();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "";
  const currentUserName = currentUser?.fullName ?? "You";

  // Join meeting when token is ready, minimize on unmount
  useEffect(() => {
    if (!tokenData) return;
    if (meetingCtx.isInMeeting && meetingCtx.meetingId === meetingId) {
      meetingCtx.maximize();
    } else {
      meetingCtx.joinMeeting({
        classId,
        meetingId,
        role: "educator",
        tokenData: { appId: tokenData.appId, channel: tokenData.channel, token: tokenData.token, uid: tokenData.uid },
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
    chat,
    sendChat,
    currentUserId,
    currentUserName,
  });

  const respondMutation = useRespondToJoinRequest(classId, meetingId);
  const endMeetingMutation = useEndMeeting(classId);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [sidePanel, setSidePanel] = useState<"chat" | "participants" | "join-requests" | null>(null);
  const [showPresModal, setShowPresModal] = useState(false);
  const { presentation, selectPresentation, clearPresentation } = useMeetingPresentation(classId);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [pipSize, setPipSize] = useState({ w: 240, h: 160 });
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showPipMenu, setShowPipMenu] = useState(false);
  const [pipResizing, setPipResizing] = useState(false);
  const pipRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, corner: "se" | "sw" | "ne" | "nw" | "e" | "w" | "n" | "s") => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    resizeRef.current = { startX, startY, startW: pipSize.w, startH: pipSize.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      let dx = ev.clientX - resizeRef.current.startX;
      let dy = ev.clientY - resizeRef.current.startY;
      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;
      if (corner.includes("e")) newW += dx;
      if (corner.includes("w")) newW -= dx;
      if (corner.includes("s")) newH += dy;
      if (corner.includes("n")) newH -= dy;
      setPipSize({ w: Math.max(120, newW), h: Math.max(80, newH) });
    };

    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const pendingRequests = meeting?.joinRequests.filter((r) => r.status === "pending") ?? [];

  // Re-play local video when track or mode changes
  useEffect(() => {
    if (!localVideo) return;
    const id = localExpanded ? "local-video-grid" : "local-video-pip";
    const el = document.getElementById(id);
    if (el) {
      localVideo.play(id);
    }
  }, [localVideo, localExpanded, isPresenting]);

  const handleToggleMic = async () => {
    await toggleMic();
    setMicOn((v) => !v);
  };

  const handleToggleCam = async () => {
    await toggleCamera();
    setCamOn((v) => !v);
  };

  const handleToggleHand = () => {
    if (handRaised) lowerHand(); else raiseHand();
    setHandRaised((v) => !v);
  };

  const handleRespond = (reqId: string, status: "accepted" | "declined") => {
    respondMutation.mutate({ reqId, status });
  };

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

  return (
    <div className={cn(
      "flex flex-col bg-zinc-950 text-white overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50" : "h-screen"
    )}>
      <div className="flex-1 flex overflow-hidden relative">
        {isPresenting ? (
          <>
            <PresentationOverlay
              presentation={presentation}
              currentSlideIndex={currentSlide}
              onChangeSlide={changeSlide}
            />
            {/* PIP overlay on top of presentation */}
            {!localExpanded && (
              <div
                ref={pipRef}
                id="local-video-pip"
                style={{ width: pipSize.w, height: pipSize.h }}
                onClick={() => { if (pipResizing) { setPipResizing(false); } else { setShowPipMenu((v) => !v); } }}
                className="absolute bottom-4 right-4 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-20 select-none cursor-default"
              >
              {!camOn && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none z-0">
                  <VideoOff className="h-6 w-6" />
                </div>
              )}
              <div className="absolute bottom-1.5 left-1.5 text-[10px] text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded pointer-events-none z-0">
                You {micOn ? "" : "🔇"}
              </div>
              {showPipMenu && (
                <>
                  <div className="absolute inset-0 bg-black/40 z-10" onClick={(e) => { e.stopPropagation(); setShowPipMenu(false); }} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-20">
                    <button onClick={(e) => { e.stopPropagation(); setLocalExpanded(true); setShowPipMenu(false); }} className="h-8 px-3 text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap">Full Display</button>
                    <button onClick={(e) => { e.stopPropagation(); setPipResizing(true); setShowPipMenu(false); }} className="h-8 px-3 text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap">Resize</button>
                  </div>
                </>
              )}
              {pipResizing && (
                <>
                  <div onMouseDown={(e) => handleResizeStart(e, "se")} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30 hover:bg-zinc-500/40 rounded-bl" />
                  <div onMouseDown={(e) => handleResizeStart(e, "sw")} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-30 hover:bg-zinc-500/40 rounded-br" />
                  <div onMouseDown={(e) => handleResizeStart(e, "ne")} className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-30 hover:bg-zinc-500/40 rounded-bl" />
                  <div onMouseDown={(e) => handleResizeStart(e, "nw")} className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-30 hover:bg-zinc-500/40 rounded-br" />
                  <div onMouseDown={(e) => handleResizeStart(e, "e")} className="absolute top-0 bottom-0 right-0 w-1.5 cursor-e-resize z-30 hover:bg-zinc-500/30" />
                  <div onMouseDown={(e) => handleResizeStart(e, "w")} className="absolute top-0 bottom-0 left-0 w-1.5 cursor-w-resize z-30 hover:bg-zinc-500/30" />
                  <div onMouseDown={(e) => handleResizeStart(e, "n")} className="absolute left-0 right-0 top-0 h-1.5 cursor-n-resize z-30 hover:bg-zinc-500/30" />
                  <div onMouseDown={(e) => handleResizeStart(e, "s")} className="absolute left-0 right-0 bottom-0 h-1.5 cursor-s-resize z-30 hover:bg-zinc-500/30" />
                </>
              )}
              {pipResizing && (
                <div className="absolute top-1 inset-x-1 flex justify-center z-30 pointer-events-none">
                  <span className="text-[9px] text-zinc-500 bg-zinc-900/70 px-2 py-0.5 rounded">Drag edges to resize · click to close</span>
                </div>
              )}
            </div>
            )}
          </>
        ) : (
        <div className="flex-1 relative">
          <div className={cn(
            "h-full grid gap-1 p-1",
            localExpanded
              ? remoteUsers.length === 0
                ? "grid-cols-1"
                : "grid-cols-2"
              : remoteUsers.length === 0
                ? "place-items-center"
                : remoteUsers.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
          )}>
            {!localExpanded && remoteUsers.length === 0 && !joined && (
              <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
            )}
            {localExpanded && (
              <div
                id="local-video-grid"
                className="rounded-lg bg-zinc-800 w-full min-h-[300px] border border-zinc-700 overflow-hidden relative"
              >
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none">
                    <VideoOff className="h-6 w-6" />
                  </div>
                )}
                <div className="absolute top-0 inset-x-0 h-8 flex items-center justify-between px-2 bg-gradient-to-b from-black/50 to-transparent z-10">
                  <span className="text-xs text-zinc-300">Your Camera</span>
                  <button
                    onClick={() => setLocalExpanded(false)}
                    className="h-6 w-6 flex items-center justify-center rounded-md bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 text-xs text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded pointer-events-none z-10">
                  You {micOn ? "" : "🔇"}
                </div>
              </div>
            )}
            {remoteUsers.map((user) => (
              <div
                key={String(user.uid)}
                id={`remote-${user.uid}`}
                className="rounded-lg bg-zinc-800 w-full h-full min-h-[200px]"
              />
            ))}
          </div>

          {/* Local video PIP (collapsed) */}
          {!localExpanded && (
            <div
              ref={pipRef}
              id="local-video-pip"
              style={{ width: pipSize.w, height: pipSize.h }}
              onClick={() => { if (pipResizing) { setPipResizing(false); } else { setShowPipMenu((v) => !v); } }}
              className="absolute bottom-4 right-4 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-10 select-none cursor-default"
            >
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 pointer-events-none z-0">
                <VideoOff className="h-6 w-6" />
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 text-[10px] text-zinc-400 bg-zinc-900/60 px-1.5 py-0.5 rounded pointer-events-none z-0">
              You {micOn ? "" : "🔇"}
            </div>
            {showPipMenu && (
              <>
                <div className="absolute inset-0 bg-black/40 z-10" onClick={(e) => { e.stopPropagation(); setShowPipMenu(false); }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-20">
                  <button onClick={(e) => { e.stopPropagation(); setLocalExpanded(true); setShowPipMenu(false); }} className="h-8 px-3 text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap">Full Display</button>
                  <button onClick={(e) => { e.stopPropagation(); setPipResizing(true); setShowPipMenu(false); }} className="h-8 px-3 text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 text-white rounded-lg border border-zinc-700 whitespace-nowrap">Resize</button>
                </div>
              </>
            )}
            {pipResizing && (
              <>
                <div onMouseDown={(e) => handleResizeStart(e, "se")} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30 hover:bg-zinc-500/40 rounded-bl" />
                <div onMouseDown={(e) => handleResizeStart(e, "sw")} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-30 hover:bg-zinc-500/40 rounded-br" />
                <div onMouseDown={(e) => handleResizeStart(e, "ne")} className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-30 hover:bg-zinc-500/40 rounded-bl" />
                <div onMouseDown={(e) => handleResizeStart(e, "nw")} className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-30 hover:bg-zinc-500/40 rounded-br" />
                <div onMouseDown={(e) => handleResizeStart(e, "e")} className="absolute top-0 bottom-0 right-0 w-1.5 cursor-e-resize z-30 hover:bg-zinc-500/30" />
                <div onMouseDown={(e) => handleResizeStart(e, "w")} className="absolute top-0 bottom-0 left-0 w-1.5 cursor-w-resize z-30 hover:bg-zinc-500/30" />
                <div onMouseDown={(e) => handleResizeStart(e, "n")} className="absolute left-0 right-0 top-0 h-1.5 cursor-n-resize z-30 hover:bg-zinc-500/30" />
                <div onMouseDown={(e) => handleResizeStart(e, "s")} className="absolute left-0 right-0 bottom-0 h-1.5 cursor-s-resize z-30 hover:bg-zinc-500/30" />
              </>
            )}
            {pipResizing && (
              <div className="absolute top-1 inset-x-1 flex justify-center z-30 pointer-events-none">
                <span className="text-[9px] text-zinc-500 bg-zinc-900/70 px-2 py-0.5 rounded">Drag edges to resize · click to close</span>
              </div>
            )}
          </div>
        )}
        </div>
        )}

        {sidePanel && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium capitalize">
                {sidePanel === "join-requests" ? "Join Requests" : sidePanel}
              </span>
              <button onClick={() => setSidePanel(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
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
            </div>
          </div>
        )}

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

      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      {/* Controls bar */}
      <div className="relative h-16 flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4">
        <div className={cn(
          "absolute left-4 flex items-center gap-1.5 text-[11px]",
          connected ? "text-emerald-400" : "text-zinc-500"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-400" : "bg-zinc-500")} />
          {connected ? "Connected" : "Connecting..."}
        </div>

        <button
          onClick={handleToggleMic}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            micOn ? "text-zinc-300 hover:bg-zinc-800" : "text-red-400 hover:bg-red-900/30"
          )}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          {micOn ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={handleToggleCam}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            camOn ? "text-zinc-300 hover:bg-zinc-800" : "text-red-400 hover:bg-red-900/30"
          )}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          {camOn ? "Stop Video" : "Start Video"}
        </button>

        <button
          onClick={handleToggleHand}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            handRaised ? "text-amber-400 hover:bg-amber-900/30" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Hand className="h-5 w-5" />
          {handRaised ? "Lower Hand" : "Raise Hand"}
        </button>

        <button
          onClick={() => setShowReactions((v) => !v)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <Smile className="h-5 w-5" />
          React
        </button>

        <button
          onClick={() => isPresenting ? handleStopPresentation() : setShowPresModal(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            isPresenting ? "text-primary bg-primary/10" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Monitor className="h-5 w-5" />
          {isPresenting ? "Stop" : "Present"}
        </button>

        <button
          onClick={() => setSidePanel((p) => p === "chat" ? null : "chat")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            sidePanel === "chat" ? "text-primary bg-primary/10" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <MessageSquare className="h-5 w-5" />
          Chat
        </button>

        <button
          onClick={() => setIsFullscreen((v) => !v)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            isFullscreen ? "text-primary bg-primary/10" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          {isFullscreen ? "Exit Full" : "Full Screen"}
        </button>

        <button
          onClick={() => setSidePanel((p) => p === "participants" ? null : "participants")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            sidePanel === "participants" ? "text-primary bg-primary/10" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Users className="h-5 w-5" />
          {participants.length > 0 ? `${participants.length}` : "People"}
        </button>

        <button
          onClick={() => setSidePanel((p) => p === "join-requests" ? null : "join-requests")}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors relative",
            sidePanel === "join-requests" ? "text-amber-400 bg-amber-900/20" : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <UserPlus className="h-5 w-5" />
          Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-zinc-950">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={handleLeave}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Leave
        </button>

        <button
          onClick={handleEndMeeting}
          disabled={endMeetingMutation.isPending}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {endMeetingMutation.isPending ? "Ending..." : "End"}
        </button>
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
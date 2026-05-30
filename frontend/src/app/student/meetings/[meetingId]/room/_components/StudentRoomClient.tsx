"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, Hand, MessageSquare,
  Users, LogOut, Smile, Maximize, Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useMeetingToken } from "@/hooks/student/useStudentMeetings";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import { useChat } from "@/hooks/meeting/useChat";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { getAccessToken } from "@/api/client";
import PresentationOverlay from "@/components/meeting/PresentationOverlay";
import { useMeetingPresentation } from "@/hooks/meeting/useMeetingPresentation";

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

function DraggableVideo({ children, className }: {
  children?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{x: number; y: number} | null>(null);
  const drag = useRef<{ox: number; oy: number} | null>(null);

  console.log("DRAG: component render, ref:", ref.current ? "set" : "null");

  useEffect(() => {
    console.log("DRAG: useEffect run, ref:", ref.current ? "set" : "null");
    const el = ref.current;
    if (!el) { console.log("DRAG: ref null on mount"); return; }
    console.log("DRAG: mounted, el:", el.id || el.className);

    const onDown = (e: MouseEvent) => {
      console.log("DRAG: mousedown", e.clientX, e.clientY);
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      drag.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top };
      const parent = el.parentElement;
      if (!parent) { console.log("DRAG: no parent"); return; }
      const prect = parent.getBoundingClientRect();
      const newPos = { x: rect.left - prect.left, y: rect.top - prect.top };
      console.log("DRAG: setPos", newPos);
      setPos(newPos);
    };

    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      console.log("DRAG: mousemove", e.clientX, e.clientY);
      e.preventDefault();
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      const newPos = {
        x: Math.max(0, Math.min(e.clientX - drag.current.ox - prect.left, prect.width - el.offsetWidth)),
        y: Math.max(0, Math.min(e.clientY - drag.current.oy - prect.top, prect.height - el.offsetHeight)),
      };
      console.log("DRAG: setPos move", newPos);
      setPos(newPos);
    };

    const onUp = () => { console.log("DRAG: mouseup"); drag.current = null; };

    const onTouchDown = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      console.log("DRAG: touchstart", t.clientX, t.clientY);
      const rect = el.getBoundingClientRect();
      drag.current = { ox: t.clientX - rect.left, oy: t.clientY - rect.top };
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({ x: rect.left - prect.left, y: rect.top - prect.top });
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current) return;
      const t = e.touches[0];
      if (!t) return;
      console.log("DRAG: touchmove", t.clientX, t.clientY);
      const parent = el.parentElement;
      if (!parent) return;
      const prect = parent.getBoundingClientRect();
      setPos({
        x: Math.max(0, Math.min(t.clientX - drag.current.ox - prect.left, prect.width - el.offsetWidth)),
        y: Math.max(0, Math.min(t.clientY - drag.current.oy - prect.top, prect.height - el.offsetHeight)),
      });
    };

    const onTouchEnd = () => { console.log("DRAG: touchend"); drag.current = null; };

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", onTouchDown, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onTouchDown);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "absolute",
        cursor: "grab",
        ...(pos === null
          ? { right: 16, bottom: 16 }
          : { left: pos.x, top: pos.y }),
      }}
    >
      {children}
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

export default function StudentMeetingRoomClient(): React.JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const searchParams = useSearchParams();
  const urlClassId = searchParams.get("classId") ?? "";
  const router = useRouter();

  const { data: tokenData, isLoading: tokenLoading } = useMeetingToken(meetingId);
  const meetingClassId = tokenData?.classId ?? "";
  const classId = meetingClassId || urlClassId;
  const authToken = getAccessToken() ?? "";
  const meetingCtx = useMeetingContext();
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "";
  const currentUserName = currentUser?.fullName ?? "You";

  useEffect(() => {
    if (!tokenData) return;
    if (meetingCtx.isInMeeting && meetingCtx.meetingId === meetingId) {
      meetingCtx.maximize();
    } else {
      meetingCtx.joinMeeting({
        classId,
        meetingId,
        role: "student",
        tokenData: { appId: tokenData.appId, channel: tokenData.channel, token: tokenData.token, uid: tokenData.uid },
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
  } = meetingCtx;

  const { presentation, isLoading, isError } = useMeetingPresentation(classId, presentationId);

  const { messages: chatMessages, send: sendChatMessage } = useChat({
    chat,
    sendChat,
    currentUserId,
    currentUserName,
  });

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [sidePanel, setSidePanel] = useState<"chat" | "participants" | null>(null);

// Replace the existing localVideo useEffect
useEffect(() => {
  if (!localVideo) return;
  const raf = requestAnimationFrame(() => {
    const el = document.getElementById("local-video-pip");
    if (el) localVideo.play("local-video-pip");
  });
  return () => cancelAnimationFrame(raf);
}, [localVideo, isPresenting]);

  // Re-play remote video tracks when presentation mode toggles (DOM elements recreated)
useEffect(() => {
  const raf = requestAnimationFrame(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        user.videoTrack.play(`remote-${user.uid}`);
      }
    });
  });
  return () => cancelAnimationFrame(raf);
}, [isPresenting, remoteUsers]);

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

  const handleLeave = () => {
    meetingCtx.leaveMeeting();
    router.push(`/student/meetings/${meetingId}?classId=${classId}`);
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
        <Button variant="outline" onClick={() => router.push("/student/meetings")}>
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
  <div className="flex-1 relative overflow-hidden">
    {presentationId ? (
      <PresentationOverlay
        presentation={presentation}
        currentSlideIndex={currentSlide}
        error={isError}
        isLoading={isLoading}
      />
    ) : (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">Educator is preparing the presentation...</p>
      </div>
    )}

    {/* Remote user (educator) PIP overlays */}
    {remoteUsers.map((user) => (
      <DraggableVideo key={String(user.uid)} className="w-52 h-36 z-20">
        <div
          id={`remote-${user.uid}`}
          className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
        />
      </DraggableVideo>
    ))}

    {/* Local video PIP */}
    <DraggableVideo key={`local-pip-${isPresenting}`} className="w-52 h-36 z-20">
      <div
        id="local-video-pip"
        className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
      />
    </DraggableVideo>
  </div>
) : (
        <div className="flex-1 relative">
          <div className={cn(
            "h-full grid gap-1 p-1",
            remoteUsers.length === 0 ? "place-items-center"
              : remoteUsers.length === 1 ? "grid-cols-1"
              : "grid-cols-2"
          )}>
            {remoteUsers.length === 0 && !joined && (
              <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
            )}
            {remoteUsers.map((user) => (
              <div
                key={String(user.uid)}
                id={`remote-${user.uid}`}
                className="rounded-lg bg-zinc-800 w-full h-full min-h-[200px]"
              />
            ))}
          </div>

          {/* Local video PIP */}
          <div
            id="local-video-pip"
            className="absolute bottom-4 right-4 w-52 h-36 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-10"
          />
        </div>
        )}

        {sidePanel && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium capitalize">{sidePanel}</span>
              <button onClick={() => setSidePanel(null)} className="text-zinc-400 hover:text-white text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidePanel === "chat" ? (
                <ChatPanel messages={chatMessages} currentUserId={currentUserId} onSend={sendChatMessage} />
              ) : (
                <ParticipantsPanel participants={participants} />
              )}
            </div>
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
          onClick={handleLeave}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-red-900/30 transition-colors ml-2"
        >
          <LogOut className="h-5 w-5" />
          Leave
        </button>
      </div>
    </div>
  );
}
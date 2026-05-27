"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  Users,
  LogOut,
  Smile,
  DoorOpen,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getAccessToken } from "@/api/client";
import { useAgoraRTC } from "@/hooks/meeting/useAgoraRTC";
import { useMeetingSocket } from "@/hooks/meeting/useMeetingSocket";
import {
  useMeeting,
  useMeetingToken,
  useEnrolledStudents,
  useRespondToJoinRequest,
  useEndMeeting,
} from "@/hooks/educator/useMeeting";
import type { EnrolledStudent } from "@/types/educator/meeting.types";

const REACTIONS = ["👍", "👏", "❤️", "😂", "😮", "🎉"];

function ReactionPicker({
  onPick,
  onClose,
}: {
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

function ChatPanel({
  chat,
  onSend,
}: {
  chat: { userId: string; name: string; message: string; sentAt: string }[];
  onSend: (msg: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chat.map((msg, i) => (
          <div key={`${msg.userId}-${i}`} className="space-y-0.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              {msg.name}
            </p>
            <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-1.5">
              {msg.message}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border/60 p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send a message..."
          className="flex-1 text-sm bg-muted/50 rounded-lg px-3 py-1.5 outline-none border border-border/40 focus:border-primary/50"
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

function ParticipantsPanel({
  participants,
}: {
  participants: { userId: string; name: string; role: string; handRaised: boolean }[];
}) {
  return (
    <div className="p-3 space-y-1 overflow-y-auto">
      {participants.map((p) => (
        <div
          key={p.userId}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/40"
        >
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

function JoinRequestsPanel({
  requests,
  students,
  onRespond,
  isPending,
}: {
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
          <div
            key={req.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {student?.fullName ?? req.studentId}
              </p>
              {student?.email && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {student.email}
                </p>
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

  const {
    joined,
    localVideo,
    localAudio,
    remoteUsers,
    toggleMic,
    toggleCamera,
  } = useAgoraRTC(
    tokenData
      ? {
          appId: tokenData.appId,
          channel: tokenData.channel,
          token: tokenData.token,
          uid: tokenData.uid,
        }
      : { appId: "", channel: "", token: "", uid: 0 }
  );

  const {
    connected,
    participants,
    chat,
    currentSlide,
    isPresenting,
    sendChat,
    raiseHand,
    lowerHand,
    sendReaction,
    changeSlide,
    startPresentation,
    stopPresentation,
  } = useMeetingSocket({ meetingId, token: authToken });

  const respondMutation = useRespondToJoinRequest(classId, meetingId);
  const endMeetingMutation = useEndMeeting(classId);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [sidePanel, setSidePanel] = useState<"chat" | "participants" | "join-requests" | null>(null);

  const pendingRequests = meeting?.joinRequests.filter((r) => r.status === "pending") ?? [];

  useEffect(() => {
    if (localVideo && localVideoRef.current) {
      localVideo.play(localVideoRef.current);
    }
  }, [localVideo]);

  const handleToggleMic = async () => {
    await toggleMic();
    setMicOn((v) => !v);
  };

  const handleToggleCam = async () => {
    await toggleCamera();
    setCamOn((v) => !v);
  };

  const handleToggleHand = () => {
    if (handRaised) {
      lowerHand();
    } else {
      raiseHand();
    }
    setHandRaised((v) => !v);
  };

  const handleRespond = (reqId: string, status: "accepted" | "declined") => {
    respondMutation.mutate({ reqId, status });
  };

  const handleEndMeeting = () => {
    endMeetingMutation.mutate(meetingId, {
      onSuccess: () => {
        router.push(`/educator/classes/${classId}/meetings/${meetingId}`);
      },
    });
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
        <p className="text-sm text-muted-foreground">
          You are not authorized to join this meeting.
        </p>
        <Button variant="outline" onClick={() => router.push(`/educator/classes/${classId}/meetings`)}>
          Back to Meetings
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Video grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Remote users */}
        <div
          className={cn(
            "flex-1 grid gap-1 p-1",
            remoteUsers.length === 0
              ? "place-items-center"
              : remoteUsers.length === 1
              ? "grid-cols-1"
              : "grid-cols-2"
          )}
        >
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

        {/* Local video — picture-in-picture */}
        <div
          ref={localVideoRef}
          className="absolute bottom-4 right-4 w-36 h-24 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-10"
        />

        {/* Slide sync indicator */}
        {isPresenting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-zinc-800/80 backdrop-blur-sm text-xs text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700 z-10">
            📽 Presenting · Slide {currentSlide + 1}
          </div>
        )}

        {/* Side panel */}
        {sidePanel && (
          <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium capitalize">
                {sidePanel === "join-requests" ? "Join Requests" : sidePanel}
              </span>
              <button
                onClick={() => setSidePanel(null)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidePanel === "chat" ? (
                <ChatPanel chat={chat} onSend={sendChat} />
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

      {/* Reaction picker */}
      {showReactions && (
        <ReactionPicker
          onPick={sendReaction}
          onClose={() => setShowReactions(false)}
        />
      )}

      {/* Controls bar */}
      <div className="relative h-16 flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-900 px-4">
        {/* Connection indicator */}
        <div
          className={cn(
            "absolute left-4 flex items-center gap-1.5 text-[11px]",
            connected ? "text-emerald-400" : "text-zinc-500"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connected ? "bg-emerald-400" : "bg-zinc-500"
            )}
          />
          {connected ? "Connected" : "Connecting..."}
        </div>

        {/* Mic */}
        <button
          onClick={handleToggleMic}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            micOn
              ? "text-zinc-300 hover:bg-zinc-800"
              : "text-red-400 hover:bg-red-900/30"
          )}
        >
          {micOn ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
          {micOn ? "Mute" : "Unmute"}
        </button>

        {/* Camera */}
        <button
          onClick={handleToggleCam}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            camOn
              ? "text-zinc-300 hover:bg-zinc-800"
              : "text-red-400 hover:bg-red-900/30"
          )}
        >
          {camOn ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
          {camOn ? "Stop Video" : "Start Video"}
        </button>

        {/* Raise hand */}
        <button
          onClick={handleToggleHand}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            handRaised
              ? "text-amber-400 hover:bg-amber-900/30"
              : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Hand className="h-5 w-5" />
          {handRaised ? "Lower Hand" : "Raise Hand"}
        </button>

        {/* Reactions */}
        <button
          onClick={() => setShowReactions((v) => !v)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <Smile className="h-5 w-5" />
          React
        </button>

        {/* Presentation */}
        <button
          onClick={() => {
            if (isPresenting) {
              stopPresentation();
            } else {
              startPresentation();
            }
          }}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            isPresenting
              ? "text-primary bg-primary/10"
              : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <DoorOpen className="h-5 w-5" />
          {isPresenting ? "Stop" : "Present"}
        </button>

        {/* Chat */}
        <button
          onClick={() =>
            setSidePanel((p) => (p === "chat" ? null : "chat"))
          }
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            sidePanel === "chat"
              ? "text-primary bg-primary/10"
              : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <MessageSquare className="h-5 w-5" />
          Chat
        </button>

        {/* Participants */}
        <button
          onClick={() =>
            setSidePanel((p) => (p === "participants" ? null : "participants"))
          }
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors",
            sidePanel === "participants"
              ? "text-primary bg-primary/10"
              : "text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Users className="h-5 w-5" />
          {participants.length > 0 ? `${participants.length}` : "People"}
        </button>

        {/* Join Requests */}
        <button
          onClick={() =>
            setSidePanel((p) => (p === "join-requests" ? null : "join-requests"))
          }
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors relative",
            sidePanel === "join-requests"
              ? "text-amber-400 bg-amber-900/20"
              : "text-zinc-300 hover:bg-zinc-800"
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

        {/* End Meeting */}
        <button
          onClick={handleEndMeeting}
          disabled={endMeetingMutation.isPending}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-red-900/30 transition-colors ml-2 disabled:opacity-50"
        >
          <LogOut className="h-5 w-5" />
          {endMeetingMutation.isPending ? "Ending..." : "End"}
        </button>
      </div>
    </div>
  );
}

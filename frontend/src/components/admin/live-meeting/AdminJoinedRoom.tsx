"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  Smile,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { ErrorState } from "@/components/shared/status/ErrorState";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { MeetingConfirmDialog } from "@/components/meeting/MeetingConfirmDialog";
import { MeetingControlButton } from "@/components/meeting/MeetingControlButton";
import { MeetingSidePanel } from "@/components/meeting/MeetingSidePanel";
import { ReactionOverlay } from "@/components/meeting/ReactionOverlay";
import { isMeetingVideoLocked } from "@/components/meeting/meeting-video-lock";
import {
  ParticipantsPanel,
  ReactionPicker,
  VideoGrid,
} from "@/components/student/meeting-room";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import { useChat } from "@/hooks/meeting/useChat";
import { liveMeetingApi } from "@/api/admin/live-meeting.api";
import { useAuthStore } from "@/store/auth.store";
import { readMeetingMediaPrefs } from "@/utils/meetingMediaPrefs";
import type { LiveMeeting } from "@/types/admin/live-meeting.types";
import { AdminRoomHeader } from "./AdminRoomHeader";
import { AdminControlsBar } from "./AdminControlsBar";

interface AdminJoinedRoomProps {
  meetingId: string;
  meeting: LiveMeeting | null;
  currentUserId: string;
  currentUserName: string;
  onExit: () => void;
  onEnded: () => void;
}

type Panel = "chat" | "participants" | null;

export function AdminJoinedRoom({
  meetingId,
  meeting,
  currentUserId,
  currentUserName,
  onExit,
  onEnded,
}: AdminJoinedRoomProps) {
  const meetingCtx = useMeetingContext();
  const meetingRef = useRef(meetingCtx);
  meetingRef.current = meetingCtx;

  const [tokenError, setTokenError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [micOn, setMicOn] = useState(() => readMeetingMediaPrefs().micOn);
  const [camOn, setCamOn] = useState(() => readMeetingMediaPrefs().camOn);
  const [panel, setPanel] = useState<Panel>(null);
  const [showReactions, setShowReactions] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // A fresh publisher token is requested for every join.
  useEffect(() => {
    let cancelled = false;
    setTokenError(false);

    liveMeetingApi
      .getToken(meetingId, "join")
      .then((data) => {
        if (cancelled) return;
        meetingRef.current.joinMeeting({
          classId: data.classId ?? "",
          meetingId,
          role: "admin",
          tokenData: {
            appId: data.appId,
            channel: data.channel,
            token: data.token,
            uid: data.uid,
          },
          authToken: useAuthStore.getState().accessToken ?? "",
        });
      })
      .catch(() => {
        if (!cancelled) setTokenError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, attempt]);

  const {
    joined,
    connected,
    localVideo,
    remoteUsers,
    participants,
    chat,
    isPresenting,
    meetingEnded,
    latestReaction,
    recentReactions,
    latestHandRaise,
    sendChat,
    sendReaction,
    toggleMic,
    toggleCamera,
  } = meetingCtx;

  const { messages, send } = useChat({
    chat,
    sendChat,
    currentUserId,
    currentUserName,
  });

  useEffect(() => {
    if (!meetingEnded) return;
    meetingRef.current.leaveMeeting();
    onEnded();
  }, [meetingEnded, onEnded]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (isMeetingVideoLocked()) return;
      remoteUsers.forEach((user) => {
        if (user.videoTrack) user.videoTrack.play(`remote-${user.uid}`);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [remoteUsers]);

  const handleLeave = () => {
    meetingCtx.leaveMeeting();
    onExit();
  };

  const handleToggleMic = async () => {
    await toggleMic();
    setMicOn((value) => !value);
  };

  const handleToggleCam = async () => {
    await toggleCamera();
    setCamOn((value) => !value);
  };

  const togglePanel = (next: NonNullable<Panel>) =>
    setPanel((current) => (current === next ? null : next));

  if (tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background p-4 text-foreground">
        <ErrorState
          title="Could not join the meeting"
          onRetry={() => setAttempt((value) => value + 1)}
          className="max-w-lg"
        />
        <button
          type="button"
          onClick={onExit}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to live meetings
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-room fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <AdminRoomHeader
        meeting={meeting}
        status={joined && connected ? "In the meeting" : "Joining..."}
        onBack={() => setConfirmLeave(true)}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-zinc-950">
        <VideoGrid
          joined={joined}
          remoteUsers={remoteUsers}
          camOn={camOn}
          micOn={micOn}
          isFullscreen
        />

        {(!joined || isPresenting) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
            <span className="rounded-full bg-black/70 px-3 py-1 text-center text-xs text-white">
              {!joined
                ? "Connecting your camera and mic. Check browser permissions if this takes long."
                : "A lesson presentation is being shown to the class."}
            </span>
          </div>
        )}

        <ReactionOverlay
          incomingEmoji={latestReaction ?? null}
          incomingEmojis={recentReactions}
          incomingHandRaise={latestHandRaise ?? null}
        />

        {panel && (
          <MeetingSidePanel title={panel} onClose={() => setPanel(null)}>
            {panel === "chat" ? (
              <ChatPanel
                messages={messages}
                currentUserId={currentUserId}
                onSend={send}
              />
            ) : (
              <ParticipantsPanel
                participants={participants}
                remoteUsers={remoteUsers}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                localVideo={localVideo}
                role="admin"
              />
            )}
          </MeetingSidePanel>
        )}
      </div>

      {showReactions && (
        <ReactionPicker onPick={sendReaction} onClose={() => setShowReactions(false)} />
      )}

      <AdminControlsBar>
        <MeetingControlButton
          onClick={handleToggleMic}
          active={!micOn}
          danger={!micOn}
          disabled={!joined}
          label={micOn ? "Mute" : "Unmute"}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </MeetingControlButton>

        <MeetingControlButton
          onClick={handleToggleCam}
          active={!camOn}
          danger={!camOn}
          disabled={!joined}
          label={camOn ? "Turn off camera" : "Turn on camera"}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </MeetingControlButton>

        <MeetingControlButton
          onClick={() => setShowReactions((value) => !value)}
          active={showReactions}
          label="React"
        >
          <Smile className="h-5 w-5" />
        </MeetingControlButton>

        <MeetingControlButton
          onClick={() => togglePanel("chat")}
          active={panel === "chat"}
          label="Chat"
        >
          <MessageSquare className="h-5 w-5" />
        </MeetingControlButton>

        <MeetingControlButton
          onClick={() => togglePanel("participants")}
          active={panel === "participants"}
          label="People"
          badge={participants.length}
        >
          <Users className="h-5 w-5" />
        </MeetingControlButton>

        <MeetingControlButton
          onClick={() => setConfirmLeave(true)}
          danger
          wide
          label="Leave meeting"
        >
          <PhoneOff className="h-5 w-5" />
        </MeetingControlButton>
      </AdminControlsBar>

      <MeetingConfirmDialog
        open={confirmLeave}
        title="Leave this meeting?"
        description="The meeting keeps running for everyone else."
        confirmLabel="Leave"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          handleLeave();
        }}
      />
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Hand,
  LogIn,
  LogOut,
  MessageSquare,
  Users,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/status/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ChatPanel } from "@/components/meeting/ChatPanel";
import { MeetingControlButton } from "@/components/meeting/MeetingControlButton";
import { MeetingSidePanel } from "@/components/meeting/MeetingSidePanel";
import {
  getDesktopStageCols,
  getMeetingTileRects,
} from "@/components/meeting/meeting-tile-layout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAgoraViewer } from "@/hooks/meeting/useAgoraViewer";
import { useMeetingSocket } from "@/hooks/meeting/useMeetingSocket";
import { useLiveMeetingToken } from "@/hooks/admin/useLiveMeetings";
import { useAuthStore } from "@/store/auth.store";
import type {
  LiveMeeting,
  LiveMeetingToken,
} from "@/types/admin/live-meeting.types";
import { LiveMeetingTile } from "./LiveMeetingTile";
import { AdminRoomHeader } from "./AdminRoomHeader";
import { AdminRoomNotice } from "./AdminRoomNotice";
import { AdminControlsBar } from "./AdminControlsBar";

interface AdminWatchRoomProps {
  meetingId: string;
  meeting: LiveMeeting | null;
  currentUserId: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onJoin: () => void;
  onExit: () => void;
  onEnded: () => void;
  onRetry: () => void;
}

type Panel = "chat" | "participants" | null;

export function AdminWatchRoom({
  meetingId,
  meeting,
  currentUserId,
  visible,
  onVisibleChange,
  onJoin,
  onExit,
  onEnded,
  onRetry,
}: AdminWatchRoomProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { data: tokenData, isLoading: tokenLoading } =
    useLiveMeetingToken(meetingId);

  // Latch the first token so a background refetch can never trigger a rejoin.
  const [latched, setLatched] = useState<LiveMeetingToken | null>(null);
  useEffect(() => {
    if (tokenData && !latched) setLatched(tokenData);
  }, [tokenData, latched]);
  const session = latched ?? tokenData ?? null;

  const [muted, setMuted] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const authToken = useAuthStore.getState().accessToken ?? "";

  const { connected, participants, watchers, chat, meetingEnded, setWatching } =
    useMeetingSocket({
      meetingId,
      token: session ? authToken : "",
    });

  const { joined, remoteUsers, error } = useAgoraViewer({
    appId: session?.appId ?? "",
    channel: session?.channel ?? "",
    token: session?.token ?? "",
    uid: session?.uid ?? 0,
    audioMuted: muted,
  });

  useEffect(() => {
    if (meetingEnded) onEnded();
  }, [meetingEnded, onEnded]);

  useEffect(() => {
    if (connected) setWatching(visible);
  }, [connected, visible, setWatching]);

  if (tokenLoading && !session) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background text-foreground">
        <LoadingSpinner />
        <p className="text-sm text-muted-foreground">Connecting to meeting...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <AdminRoomNotice
        icon={VideoOff}
        title="Meeting not available"
        description="It may have ended, or you may not have access to it."
        onBack={onExit}
      />
    );
  }

  function labelFor(uid: string | number): string {
    const person = meeting?.participants.find((p) => p.uid === Number(uid));
    return person ? `${person.name} (${person.role})` : `Participant ${uid}`;
  }

  const shownAsWatching = watchers.some((w) => w.userId === currentUserId);
  const rects = getMeetingTileRects(
    remoteUsers.length,
    isMobile ? undefined : getDesktopStageCols(remoteUsers.length),
  );
  const roomEmpty = connected && participants.length === 0;
  const togglePanel = (next: NonNullable<Panel>) =>
    setPanel((current) => (current === next ? null : next));

  return (
    <div className="meeting-room fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <AdminRoomHeader
        meeting={meeting}
        status={
          !joined || !connected
            ? "Connecting..."
            : shownAsWatching
              ? "Watching - they can see you"
              : "Watching quietly"
        }
        onBack={onExit}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-zinc-950">
        <div className="relative min-w-0 flex-1">
          {error ? (
            <div className="flex h-full items-center justify-center p-4">
              <ErrorState
                title="Could not connect"
                description={error}
                onRetry={onRetry}
                className="max-w-lg"
              />
            </div>
          ) : remoteUsers.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <EmptyState
                icon={VideoOff}
                title={
                  !joined
                    ? "Connecting to the room..."
                    : roomEmpty
                      ? "No one is in the room"
                      : "Waiting for video"
                }
                description={
                  roomEmpty
                    ? "Video appears again when someone joins."
                    : "Cameras show up here as soon as they are shared."
                }
                className="min-h-0 max-w-lg border-dashed md:min-h-0"
              />
            </div>
          ) : (
            remoteUsers.map((user, index) => {
              const rect = rects[index];
              if (!rect) return null;
              return (
                <div
                  key={user.uid}
                  className="absolute p-1"
                  style={{
                    left: `${rect.x}%`,
                    top: `${rect.y}%`,
                    width: `${rect.w}%`,
                    height: `${rect.h}%`,
                  }}
                >
                  <LiveMeetingTile
                    user={user}
                    label={labelFor(user.uid)}
                    className="h-full w-full"
                  />
                </div>
              );
            })
          )}
        </div>

        {panel && (
          <MeetingSidePanel title={panel} onClose={() => setPanel(null)}>
            {panel === "chat" ? (
              <ChatPanel
                messages={chat}
                currentUserId={currentUserId}
                onSend={() => undefined}
                readOnly
              />
            ) : (
              <div className="h-full space-y-2 overflow-y-auto p-3">
                {participants.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No participants yet"
                    description="People who join the meeting will show up here."
                    className="min-h-0 border-dashed bg-transparent py-8 md:min-h-0"
                  />
                )}
                {participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2.5 text-secondary-foreground"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] capitalize text-secondary-foreground/60">
                        {p.role}
                      </p>
                    </div>
                    {p.handRaised && <Hand className="h-4 w-4 shrink-0" />}
                  </div>
                ))}
                {watchers.length > 0 && (
                  <div className="space-y-1.5 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Watching ({watchers.length})
                    </p>
                    {watchers.map((w) => (
                      <p
                        key={w.userId}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Eye className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {w.userId === currentUserId ? `${w.name} (You)` : w.name}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </MeetingSidePanel>
        )}
      </div>

      <AdminControlsBar>
        <MeetingControlButton
          onClick={() => setMuted((value) => !value)}
          active={muted}
          label={muted ? "Unmute meeting" : "Mute meeting"}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </MeetingControlButton>

        <MeetingControlButton
          onClick={() => onVisibleChange(!visible)}
          active={visible}
          disabled={!connected}
          label={visible ? "Stop showing that you are watching" : "Let them know you are watching"}
        >
          {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
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

        <button
          type="button"
          onClick={onJoin}
          disabled={!connected || roomEmpty}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          Join
        </button>

        <MeetingControlButton onClick={onExit} danger wide label="Stop watching">
          <LogOut className="h-5 w-5" />
        </MeetingControlButton>
      </AdminControlsBar>
    </div>
  );
}
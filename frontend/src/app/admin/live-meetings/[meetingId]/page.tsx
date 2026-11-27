"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Hand, Users, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useAgoraViewer } from "@/hooks/meeting/useAgoraViewer";
import { useMeetingSocket } from "@/hooks/meeting/useMeetingSocket";
import {
  useLiveMeetings,
  useLiveMeetingToken,
} from "@/hooks/admin/useLiveMeetings";
import { LiveMeetingTile } from "@/components/admin/live-meeting/LiveMeetingTile";
import type { LiveMeetingToken } from "@/types/admin/live-meeting.types";

const BACK_HREF = "/admin/live-meetings";

export default function LiveMeetingWatchPage() {
  const { meetingId } = useParams<{ meetingId: string }>();

  const { data: liveMeetings, isLoading: listLoading } = useLiveMeetings();
  const meeting = liveMeetings?.find((m) => m.id === meetingId) ?? null;

  const { data: tokenData, isLoading: tokenLoading } =
    useLiveMeetingToken(meetingId);

  // Latch the first token so a background refetch can never trigger a rejoin.
  const [session, setSession] = useState<LiveMeetingToken | null>(null);
  useEffect(() => {
    if (tokenData && !session) setSession(tokenData);
  }, [tokenData, session]);

  const [muted, setMuted] = useState(false);
  const authToken = useAuthStore.getState().accessToken ?? "";

  const socketToken = session ? authToken : "";
  const { connected, participants, chat, meetingEnded } = useMeetingSocket({
    meetingId,
    token: meetingEnded_safe(socketToken),
  });

  const active = !!session && !meetingEnded;

  const { joined, remoteUsers, error } = useAgoraViewer({
    appId: active ? session.appId : "",
    channel: active ? session.channel : "",
    token: active ? session.token : "",
    uid: session?.uid ?? 0,
    audioMuted: muted,
  });

  function labelFor(uid: string | number): string {
    const person = meeting?.participants.find((p) => p.uid === Number(uid));
    return person ? `${person.name} (${person.role})` : `Participant ${uid}`;
  }

  if (tokenLoading || (listLoading && !meeting)) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          This meeting is not available. It may have ended.
        </p>
        <Link href={BACK_HREF}>
          <Button variant="outline">Back to live meetings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={BACK_HREF}
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Live meetings
          </Link>
          <h1 className="truncate text-xl font-bold">
            {meeting?.title ?? "Live meeting"}
          </h1>
          {meeting && (
            <p className="text-xs text-muted-foreground">
              {meeting.subjectName} - Host: {meeting.educatorName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {joined && connected ? "Watching" : "Connecting..."}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMuted((v) => !v)}
          >
            {muted ? (
              <VolumeX className="mr-1.5 h-4 w-4" />
            ) : (
              <Volume2 className="mr-1.5 h-4 w-4" />
            )}
            {muted ? "Unmute" : "Mute"}
          </Button>
        </div>
      </div>

      {meetingEnded && (
        <div className="rounded-lg border border-border bg-muted p-4 text-sm">
          This meeting has ended.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!meeting && !meetingEnded && !listLoading && (
        <div className="rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
          No one is in the room right now. You will see video again when
          someone joins.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {remoteUsers.length === 0 ? (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-400">
              {joined ? "Waiting for video..." : "Connecting to the room..."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {remoteUsers.map((user) => (
                <LiveMeetingTile
                  key={user.uid}
                  user={user}
                  label={labelFor(user.uid)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" />
              People ({participants.length})
            </h2>
            <ul className="space-y-2">
              {participants.map((p) => (
                <li
                  key={p.userId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {p.handRaised && <Hand className="h-3.5 w-3.5" />}
                    {p.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Chat (read only)</h2>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {chat.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No messages yet.
                </p>
              ) : (
                chat.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-medium">{msg.senderName}: </span>
                    <span className="break-words">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
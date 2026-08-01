"use client";

import { cn } from "@/lib/utils";

interface RemoteUser {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface VideoGridProps {
  joined: boolean;
  remoteUsers: RemoteUser[];
}

export function VideoGrid({ joined, remoteUsers }: VideoGridProps) {
  return (
    <div className="flex-1 relative">
      <div className={cn(
        "h-full grid gap-1 p-1",
        remoteUsers.length === 0
          ? "place-items-center"
          : remoteUsers.length === 1
            ? "grid-cols-1"
            : "grid-cols-2",
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

      {/* Local video PIP — static in grid mode */}
      <div
        id="local-video-pip"
        className="absolute bottom-4 right-4 w-32 h-24 sm:w-52 sm:h-36 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-10"
      />
    </div>
  );
}
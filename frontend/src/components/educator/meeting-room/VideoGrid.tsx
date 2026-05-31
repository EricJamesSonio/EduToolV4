"use client";

import { cn } from "@/lib/utils";
import { LocalVideoGrid } from "./LocalVideoGrid";
import PipVideo from "./PipVideo";

interface RemoteUser {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface VideoGridProps {
  joined: boolean;
  camOn: boolean;
  micOn: boolean;
  localExpanded: boolean;
  remoteUsers: RemoteUser[];
  onExpand: () => void;
  onCollapse: () => void;
}

export function VideoGrid({
  joined, camOn, micOn, localExpanded, remoteUsers, onExpand, onCollapse,
}: VideoGridProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <div className={cn(
        "h-full grid gap-1 p-1",
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
          <LocalVideoGrid camOn={camOn} micOn={micOn} onCollapse={onCollapse} />
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
          onExpand={onExpand}
        />
      )}
    </div>
  );
}
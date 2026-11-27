"use client";

import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface LiveMeetingTileProps {
  user: IAgoraRTCRemoteUser;
  label: string;
}

export function LiveMeetingTile({ user, label }: LiveMeetingTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoTrack = user.videoTrack;

  useEffect(() => {
    const element = containerRef.current;

    if (!element || !videoTrack) return;

    videoTrack.play(element);

    return () => {
      videoTrack.stop();
    };
  }, [videoTrack]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900 shadow-sm ring-1 ring-border">
      <div ref={containerRef} className="absolute inset-0" />

      {!videoTrack && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <VideoOff className="h-7 w-7" />
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white">
        {label}
      </div>
    </div>
  );
}
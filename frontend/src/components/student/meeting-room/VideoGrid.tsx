"use client";

import { useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import {
  MeetingTileStage,
  type MeetingTile,
} from "@/components/meeting/MeetingTileStage";
import { FloatingLocalVideo } from "@/components/meeting/FloatingLocalVideo";
import { isMeetingVideoLocked } from "@/components/meeting/meeting-video-lock";
import { getDesktopStageCols } from "@/components/meeting/meeting-tile-layout";

interface RemoteUser {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface VideoGridProps {
  joined: boolean;
  remoteUsers: RemoteUser[];
  camOn?: boolean;
  micOn?: boolean;
  isFullscreen?: boolean;
}

export function VideoGrid({
  joined,
  remoteUsers,
  camOn = true,
  micOn = true,
  isFullscreen = true,
}: VideoGridProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { localVideo } = useMeetingContext();

  const showFloating = isMobile && (!isFullscreen || remoteUsers.length === 1);
  const localInGrid = isMobile && !showFloating;
  const mobileTileCount = remoteUsers.length + (localInGrid ? 1 : 0);

  useEffect(() => {
    if (!isMobile || !localVideo) return;
    const raf = requestAnimationFrame(() => {
      if (isMeetingVideoLocked()) return;
      if (document.getElementById("local-video-pip")) {
        localVideo.play("local-video-pip");
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isMobile, localVideo, showFloating, mobileTileCount]);

  const tiles: MeetingTile[] = remoteUsers.map((user) => ({
    key: `remote-${user.uid}`,
    domId: `remote-${user.uid}`,
  }));

  if (localInGrid) {
    tiles.push({
      key: "local",
      domId: "local-video-pip",
      label: "You",
      camOff: !camOn,
      micOff: !micOn,
    });
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {tiles.length === 0 ? (
        (isMobile || !joined) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
          </div>
        )
      ) : (
        <div className="absolute inset-0">
          <MeetingTileStage
            tiles={tiles}
            maxCols={isMobile ? undefined : getDesktopStageCols(tiles.length)}
          />
        </div>
      )}

      {isMobile ? (
        showFloating && (
          <FloatingLocalVideo
            videoId="local-video-pip"
            camOn={camOn}
            micOn={micOn}
          />
        )
      ) : (
        <div
          id="local-video-pip"
          className="absolute bottom-4 right-4 w-32 h-24 sm:w-52 sm:h-36 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg z-10"
        />
      )}
    </div>
  );
}
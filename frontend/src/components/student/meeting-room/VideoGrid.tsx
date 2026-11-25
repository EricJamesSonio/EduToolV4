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
  remoteUsers,
  camOn = true,
  micOn = true,
  isFullscreen = true,
}: VideoGridProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { localVideo } = useMeetingContext();

  // Alone in the meeting: the local camera fills the stage (no mini view).
  // As soon as someone joins, they take the stage and the local camera
  // becomes the movable mini view.
  const alone = remoteUsers.length === 0;

  const showFloating =
    !alone && (isMobile ? !isFullscreen || remoteUsers.length === 1 : true);
  const localInGrid = !showFloating;
  const tileCount = remoteUsers.length + (localInGrid ? 1 : 0);

  useEffect(() => {
    if (!localVideo) return;
    const raf = requestAnimationFrame(() => {
      if (isMeetingVideoLocked()) return;
      if (document.getElementById("local-video-pip")) {
        localVideo.play("local-video-pip");
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [localVideo, isMobile, showFloating, tileCount]);

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
      <div className="absolute inset-0">
        <MeetingTileStage
          tiles={tiles}
          maxCols={isMobile ? undefined : getDesktopStageCols(tiles.length)}
        />
      </div>

      {alone && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
          <span className="rounded-full bg-black/55 px-3 py-1 text-xs text-white">
            Waiting for others to join...
          </span>
        </div>
      )}

      {showFloating && (
        <FloatingLocalVideo
          videoId="local-video-pip"
          camOn={camOn}
          micOn={micOn}
          sizeClass={isMobile ? "h-32 w-24" : "h-36 w-52"}
        />
      )}
    </div>
  );
}
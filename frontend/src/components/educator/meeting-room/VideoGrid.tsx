"use client";

import { useEffect } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import PipVideo from "./PipVideo";
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
  camOn: boolean;
  micOn: boolean;
  localExpanded: boolean;
  remoteUsers: RemoteUser[];
  onExpand: () => void;
  onCollapse: () => void;
  isFullscreen?: boolean;
}

export function VideoGrid({
  joined, camOn, micOn, localExpanded, remoteUsers, onExpand, onCollapse,
  isFullscreen = true,
}: VideoGridProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { localVideo } = useMeetingContext();

  const showFloating = !isFullscreen || remoteUsers.length === 1;
  const mobileTileCount = remoteUsers.length + (showFloating ? 0 : 1);

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

  if (isMobile) {
    const tiles: MeetingTile[] = remoteUsers.map((user) => ({
      key: `remote-${user.uid}`,
      domId: `remote-${user.uid}`,
    }));

    if (!showFloating) {
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
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
          </div>
        ) : (
          <div className="absolute inset-0">
            <MeetingTileStage tiles={tiles} />
          </div>
        )}

        {showFloating && (
          <FloatingLocalVideo
            videoId="local-video-pip"
            camOn={camOn}
            micOn={micOn}
          />
        )}
      </div>
    );
  }

  const desktopTiles: MeetingTile[] = remoteUsers.map((user) => ({
    key: `remote-${user.uid}`,
    domId: `remote-${user.uid}`,
  }));

  if (localExpanded) {
    desktopTiles.push({
      key: "local",
      domId: "local-video-grid",
      label: "You",
      camOff: !camOn,
      micOff: !micOn,
      onClose: onCollapse,
    });
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {desktopTiles.length === 0 ? (
        !joined && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Waiting for others to join...</p>
          </div>
        )
      ) : (
        <div className="absolute inset-0">
          <MeetingTileStage
            tiles={desktopTiles}
            maxCols={getDesktopStageCols(desktopTiles.length)}
          />
        </div>
      )}

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
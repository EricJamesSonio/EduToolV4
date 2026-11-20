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

function WaitingHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
      <span className="rounded-full bg-black/55 px-3 py-1 text-xs text-white">
        Waiting for others to join...
      </span>
    </div>
  );
}

export function VideoGrid({
  camOn, micOn, localExpanded, remoteUsers, onExpand, onCollapse,
  isFullscreen = true,
}: VideoGridProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { localVideo } = useMeetingContext();

  // Alone in the meeting: the local camera fills the stage (no mini view).
  // As soon as someone joins, they take the stage and the local camera
  // becomes the movable mini view.
  const alone = remoteUsers.length === 0;

  const mobileFloating = !alone && (!isFullscreen || remoteUsers.length === 1);
  const desktopLocalLarge = alone || localExpanded;

  useEffect(() => {
    if (!localVideo) return;
    const raf = requestAnimationFrame(() => {
      if (isMeetingVideoLocked()) return;
      const id = document.getElementById("local-video-grid")
        ? "local-video-grid"
        : "local-video-pip";
      if (document.getElementById(id)) localVideo.play(id);
    });
    return () => cancelAnimationFrame(raf);
  }, [
    localVideo,
    isMobile,
    alone,
    localExpanded,
    mobileFloating,
    remoteUsers.length,
  ]);

  if (isMobile) {
    const tiles: MeetingTile[] = remoteUsers.map((user) => ({
      key: `remote-${user.uid}`,
      domId: `remote-${user.uid}`,
    }));

    if (!mobileFloating) {
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
          <MeetingTileStage tiles={tiles} />
        </div>

        {alone && <WaitingHint />}

        {mobileFloating && (
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

  if (desktopLocalLarge) {
    desktopTiles.push({
      key: "local",
      domId: alone ? "local-video-pip" : "local-video-grid",
      label: "You",
      camOff: !camOn,
      micOff: !micOn,
      onClose: alone ? undefined : onCollapse,
    });
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0">
        <MeetingTileStage
          tiles={desktopTiles}
          maxCols={getDesktopStageCols(desktopTiles.length)}
        />
      </div>

      {alone && <WaitingHint />}

      {!desktopLocalLarge && (
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
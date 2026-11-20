"use client";

import { useEffect, useState } from "react";
import { VideoOff } from "lucide-react";
import PresentationOverlay, {
  type RemoteMonitor,
} from "@/components/meeting/PresentationOverlay";
import { useMeeting as useMeetingContext } from "@/hooks/meeting/MeetingContext";
import { isMeetingVideoLocked } from "@/components/meeting/meeting-video-lock";
import PipVideo from "./PipVideo";
import type { Presentation } from "@/types/educator/presentation.types";

interface PresentationViewProps {
  presentation: Presentation | null;
  currentSlide: number;
  localExpanded?: boolean;
  camOn: boolean;
  micOn: boolean;
  mobileSlidesOpen?: boolean;
  onCloseMobileSlides?: () => void;
  onChangeSlide: (index: number) => void;
  onExpand?: () => void;
  remoteUsers?: RemoteMonitor[];
  featuredUid?: string | number | null;
  onPromote?: (uid: string | number) => void;
  onExitFeatured?: () => void;
  isFullscreen?: boolean;
}

export function PresentationView({
  presentation, currentSlide,
  camOn, micOn, mobileSlidesOpen = false, onCloseMobileSlides,
  onChangeSlide,
  remoteUsers = [], featuredUid = null, onPromote, onExitFeatured, isFullscreen = true,
}: PresentationViewProps) {
  const { localVideo } = useMeetingContext();
  // "Full Display" on the self-view opens the local camera large over the
  // slides; closing it brings the movable mini view back.
  const [localFull, setLocalFull] = useState(false);

  useEffect(() => {
    if (!localVideo) return;
    const raf = requestAnimationFrame(() => {
      if (isMeetingVideoLocked()) return;
      const id = localFull ? "local-video-grid" : "local-video-pip";
      if (document.getElementById(id)) localVideo.play(id);
    });
    return () => cancelAnimationFrame(raf);
  }, [localVideo, localFull]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <PresentationOverlay
        presentation={presentation}
        currentSlideIndex={currentSlide}
        onChangeSlide={onChangeSlide}
        showSlideList
        mobileSlidesOpen={mobileSlidesOpen}
        onCloseMobileSlides={onCloseMobileSlides}
        remoteUsers={remoteUsers}
        featuredUid={featuredUid}
        onPromote={onPromote}
        onExitFeatured={onExitFeatured}
        fullscreen={isFullscreen}
      />

      {localFull && (
        <div className="absolute inset-0 z-30 bg-zinc-950 p-1">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-800 shadow-lg">
            <div id="local-video-grid" className="absolute inset-0" />

            {!camOn && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-800">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <VideoOff className="h-7 w-7" />
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute bottom-2 left-2 z-20 rounded-full bg-secondary/95 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground shadow-sm">
              You {micOn ? "" : "🔇"}
            </div>

            <button
              type="button"
              onClick={() => setLocalFull(false)}
              aria-label="Collapse camera"
              className="absolute right-1.5 top-1.5 z-30 flex h-6 w-6 items-center justify-center rounded-md bg-secondary/90 text-sm text-secondary-foreground hover:bg-secondary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!localFull && (
        <PipVideo
          videoId="local-video-pip"
          camOn={camOn}
          micOn={micOn}
          zClass="z-20"
          onExpand={() => setLocalFull(true)}
        />
      )}
    </div>
  );
}
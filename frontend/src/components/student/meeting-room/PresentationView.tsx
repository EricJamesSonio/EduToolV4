"use client";

import PresentationOverlay from "@/components/meeting/PresentationOverlay";
import { DraggableVideo } from "./DraggableVideo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Presentation } from "@/types/educator/presentation.types";

interface RemoteUser {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface PresentationViewProps {
  presentation: Presentation | null | undefined;
  currentSlide: number;
  presentationId: string | null | undefined;
  isLoading: boolean;
  isError: boolean;
  remoteUsers: RemoteUser[];
  isPresenting: boolean;
  mobileSlidesOpen?: boolean;
  onCloseMobileSlides?: () => void;
  featuredUid?: string | number | null;
  onPromote?: (uid: string | number) => void;
  onExitFeatured?: () => void;
  isFullscreen?: boolean;
}

export function PresentationView({
  presentation, currentSlide, presentationId,
  isLoading, isError, remoteUsers, isPresenting,
  mobileSlidesOpen = false, onCloseMobileSlides,
  featuredUid = null, onPromote, onExitFeatured, isFullscreen = true,
}: PresentationViewProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  // In mobile portrait mode the PresentationOverlay owns the remote-{uid}
  // elements (main monitor + rail). Suppress the floating remote PIPs there to
  // avoid duplicate ids; keep local PIP and desktop PIPs as-is.
  const portraitMode = isMobile && !isFullscreen;

  return (
    <div className="flex-1 relative overflow-hidden">
      {presentationId ? (
        <PresentationOverlay
          presentation={presentation ?? null}
          currentSlideIndex={currentSlide}
          error={isError}
          isLoading={isLoading}
          mobileSlidesOpen={mobileSlidesOpen}
          onCloseMobileSlides={onCloseMobileSlides}
          remoteUsers={remoteUsers}
          featuredUid={featuredUid}
          onPromote={onPromote}
          onExitFeatured={onExitFeatured}
          fullscreen={isFullscreen}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-950">
          <p className="text-zinc-500 text-sm">Educator is preparing the presentation...</p>
        </div>
      )}

      {/* Remote user PIPs — hidden in mobile portrait mode (see above) */}
      {!portraitMode &&
        remoteUsers.map((user) => (
          <DraggableVideo key={String(user.uid)} className="w-32 h-24 sm:w-52 sm:h-36 z-20">
            <div
              id={`remote-${user.uid}`}
              className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
            />
          </DraggableVideo>
        ))}

      {/* Local video PIP */}
      <DraggableVideo key={`local-pip-${isPresenting}`} className="w-32 h-24 sm:w-52 sm:h-36 z-20">
        <div
          id="local-video-pip"
          className="w-full h-full rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shadow-lg"
        />
      </DraggableVideo>
    </div>
  );
}
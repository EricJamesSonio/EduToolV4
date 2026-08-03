"use client";

import PresentationOverlay, {
  type RemoteMonitor,
} from "@/components/meeting/PresentationOverlay";
import PipVideo from "./PipVideo";
import type { Presentation } from "@/types/educator/presentation.types";

interface PresentationViewProps {
  presentation: Presentation | null;
  currentSlide: number;
  localExpanded: boolean;
  camOn: boolean;
  micOn: boolean;
  mobileSlidesOpen?: boolean;
  onCloseMobileSlides?: () => void;
  onChangeSlide: (index: number) => void;
  onExpand: () => void;
  remoteUsers?: RemoteMonitor[];
  featuredUid?: string | number | null;
  onPromote?: (uid: string | number) => void;
  onExitFeatured?: () => void;
  isFullscreen?: boolean;
}

export function PresentationView({
  presentation, currentSlide, localExpanded,
  camOn, micOn, mobileSlidesOpen = false, onCloseMobileSlides,
  onChangeSlide, onExpand,
  remoteUsers = [], featuredUid = null, onPromote, onExitFeatured, isFullscreen = true,
}: PresentationViewProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <PresentationOverlay
        presentation={presentation}
        currentSlideIndex={currentSlide}
        onChangeSlide={onChangeSlide}
        mobileSlidesOpen={mobileSlidesOpen}
        onCloseMobileSlides={onCloseMobileSlides}
        remoteUsers={remoteUsers}
        featuredUid={featuredUid}
        onPromote={onPromote}
        onExitFeatured={onExitFeatured}
        fullscreen={isFullscreen}
      />
      {!localExpanded && (
        <PipVideo
          videoId="local-video-pip"
          camOn={camOn}
          micOn={micOn}
          zClass="z-20"
          onExpand={onExpand}
        />
      )}
    </div>
  );
}
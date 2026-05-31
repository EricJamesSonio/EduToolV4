"use client";

import PresentationOverlay from "@/components/meeting/PresentationOverlay";
import PipVideo from "./PipVideo";
import type { Presentation } from "@/types/educator/presentation.types";

interface PresentationViewProps {
  presentation: Presentation | null;
  currentSlide: number;
  localExpanded: boolean;
  camOn: boolean;
  micOn: boolean;
  onChangeSlide: (index: number) => void;
  onExpand: () => void;
}

export function PresentationView({
  presentation, currentSlide, localExpanded,
  camOn, micOn, onChangeSlide, onExpand,
}: PresentationViewProps) {
  return (
    <div className="flex-1 relative overflow-hidden">
      <PresentationOverlay
        presentation={presentation}
        currentSlideIndex={currentSlide}
        onChangeSlide={onChangeSlide}
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
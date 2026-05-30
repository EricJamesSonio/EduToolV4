"use client";

import { useCallback } from "react";
import SlideThumbnails from "./SlideThumbnails";
import SlideViewer from "./SlideViewer";
import type { Presentation } from "@/types/educator/presentation.types";

interface Props {
  presentation: Presentation | null;
  currentSlideIndex: number;
  onChangeSlide?: (index: number) => void;
  error?: boolean;
  isLoading?: boolean;
}

export default function PresentationOverlay({ presentation, currentSlideIndex, onChangeSlide, error, isLoading }: Props) {
  const totalSlides = presentation?.slides.length ?? 0;
  const safeIndex = Math.min(Math.max(currentSlideIndex, 0), totalSlides - 1);
  const currentSlide = presentation?.slides[safeIndex] ?? null;
  const template = presentation?.template ?? "green";
  const canNavigate = !!onChangeSlide;

  const goToNext = useCallback(() => {
    if (canNavigate && safeIndex < totalSlides - 1) {
      onChangeSlide(safeIndex + 1);
    }
  }, [safeIndex, totalSlides, onChangeSlide, canNavigate]);

  const goToPrev = useCallback(() => {
    if (canNavigate && safeIndex > 0) {
      onChangeSlide(safeIndex - 1);
    }
  }, [safeIndex, onChangeSlide, canNavigate]);

  const handleThumbnailSelect = useCallback(
    (index: number) => {
      if (canNavigate) onChangeSlide(index);
    },
    [onChangeSlide, canNavigate],
  );

  if (!presentation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">
          {error ? "Failed to load presentation."
            : isLoading ? "Loading presentation..."
            : "Educator is preparing the presentation..."}
        </p>
      </div>
    );
  }

  if (totalSlides === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">This presentation has no slides.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <SlideThumbnails
        slides={presentation.slides}
        currentSlideIndex={safeIndex}
        template={template}
        onSelect={handleThumbnailSelect}
      />
      <SlideViewer
        slide={currentSlide}
        template={template}
        slideNumber={safeIndex}
        totalSlides={totalSlides}
        onNext={goToNext}
        onPrev={goToPrev}
      />
    </div>
  );
}

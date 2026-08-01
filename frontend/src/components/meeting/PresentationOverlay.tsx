"use client";

import { useCallback, useEffect } from "react";
import SlideThumbnails from "./SlideThumbnails";
import SlideViewer from "./SlideViewer";
import { MeetingBottomSheet } from "./MeetingBottomSheet";
import type { Presentation } from "@/types/educator/presentation.types";

interface Props {
  presentation: Presentation | null;
  currentSlideIndex: number;
  onChangeSlide?: (index: number) => void;
  error?: boolean;
  isLoading?: boolean;
  /** Mobile: whether the slides bottom sheet is open */
  mobileSlidesOpen?: boolean;
  onCloseMobileSlides?: () => void;
}

export default function PresentationOverlay({
  presentation,
  currentSlideIndex,
  onChangeSlide,
  error,
  isLoading,
  mobileSlidesOpen = false,
  onCloseMobileSlides,
}: Props) {
  const totalSlides = presentation?.slides.length ?? 0;
  const safeIndex = Math.min(Math.max(currentSlideIndex, 0), totalSlides - 1);
  const currentSlide = presentation?.slides[safeIndex] ?? null;
  const template = presentation?.template ?? "green";
  const canNavigate = !!onChangeSlide;

  // 🔍 DEBUG: log everything important
  useEffect(() => {
    console.log("📦 PresentationOverlay DEBUG");
    console.log("presentation:", presentation);
    console.log("template:", template);
    console.log("totalSlides:", totalSlides);
    console.log("safeIndex:", safeIndex);
    console.log("currentSlide:", currentSlide);

    if (presentation?.slides) {
      presentation.slides.forEach((s, i) => {
        if (
          s?.image === "noposter" ||
          s?.thumbnail === "noposter" ||
          s?.poster === "noposter"
        ) {
          console.warn(`⚠️ Slide ${i} contains invalid 'noposter' value:`, s);
        }
      });
    }
  }, [presentation, template, totalSlides, safeIndex, currentSlide]);

  const goToNext = useCallback(() => {
    if (canNavigate && safeIndex < totalSlides - 1) {
      console.log("➡️ Next slide:", safeIndex + 1);
      onChangeSlide?.(safeIndex + 1);
    }
  }, [safeIndex, totalSlides, onChangeSlide, canNavigate]);

  const goToPrev = useCallback(() => {
    if (canNavigate && safeIndex > 0) {
      console.log("⬅️ Prev slide:", safeIndex - 1);
      onChangeSlide?.(safeIndex - 1);
    }
  }, [safeIndex, onChangeSlide, canNavigate]);

  const handleThumbnailSelect = useCallback(
    (index: number) => {
      console.log("🖱️ Thumbnail select:", index);
      if (canNavigate) onChangeSlide?.(index);
    },
    [onChangeSlide, canNavigate],
  );

  if (!presentation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">
          {error
            ? "Failed to load presentation."
            : isLoading
            ? "Loading presentation..."
            : "Educator is preparing the presentation..."}
        </p>
      </div>
    );
  }

  if (totalSlides === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-500 text-sm">
          This presentation has no slides.
        </p>
      </div>
    );
  }

return (
  <div className="w-full h-full flex overflow-hidden bg-zinc-950">
    
    {/* Desktop: permanent left slide rail (hidden on mobile) */}
    <div className="hidden sm:block shrink-0">
      <SlideThumbnails
        slides={presentation.slides}
        currentSlideIndex={safeIndex}
        template={template}
        onSelect={canNavigate ? handleThumbnailSelect : undefined}
      />
    </div>

    {/* MAIN STAGE AREA — full width on mobile, remainder of row on desktop */}
    <div className="flex-1 h-full min-w-0 flex">
      <SlideViewer
        slide={currentSlide}
        template={template}
        slideNumber={safeIndex}
        totalSlides={totalSlides}
        onNext={canNavigate ? goToNext : undefined}
        onPrev={canNavigate ? goToPrev : undefined}
      />
    </div>

    {/* Mobile: on-demand slides bottom sheet (opened via overflow menu) */}
    <MeetingBottomSheet
      open={mobileSlidesOpen}
      onClose={onCloseMobileSlides ?? (() => {})}
      title="Slides"
    >
      <SlideThumbnails
        slides={presentation.slides}
        currentSlideIndex={safeIndex}
        template={template}
        variant="filmstrip"
        onSelect={
          canNavigate
            ? (index) => {
                handleThumbnailSelect(index);
                onCloseMobileSlides?.();
              }
            : undefined
        }
      />
    </MeetingBottomSheet>

  </div>
);
}
"use client";

import { useCallback, useEffect } from "react";
import SlideThumbnails from "./SlideThumbnails";
import SlideViewer from "./SlideViewer";
import { MeetingBottomSheet } from "./MeetingBottomSheet";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Presentation } from "@/types/educator/presentation.types";

/** A remote participant's video play target (what Agora frames render into). */
export interface RemoteMonitor {
  uid: string | number;
  videoTrack?: { play: (id: string) => void };
}

interface Props {
  presentation: Presentation | null;
  currentSlideIndex: number;
  onChangeSlide?: (index: number) => void;
  error?: boolean;
  isLoading?: boolean;
  /** Mobile: whether the slides bottom sheet is open */
  mobileSlidesOpen?: boolean;
  onCloseMobileSlides?: () => void;
  /** Remote participants (rendered as preview monitors in mobile portrait mode). */
  remoteUsers?: RemoteMonitor[];
  /** Remote participant currently promoted into the main monitor (camera replaces slide). */
  featuredUid?: string | number | null;
  /** Called when a preview monitor is tapped to promote that participant. */
  onPromote?: (uid: string | number) => void;
  /** Called to exit "featured" mode and return the main monitor to the slide. */
  onExitFeatured?: () => void;
  /** Mirrors the meeting room's isFullscreen state. true = full-bleed stage. */
  fullscreen?: boolean;
}

export default function PresentationOverlay({
  presentation,
  currentSlideIndex,
  onChangeSlide,
  error,
  isLoading,
  mobileSlidesOpen = false,
  onCloseMobileSlides,
  remoteUsers = [],
  featuredUid = null,
  onPromote,
  onExitFeatured,
  fullscreen = true,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  // Portrait "monitor-in-monitor" only applies on phones when NOT fullscreen.
  const portraitMode = isMobile && !fullscreen;
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

    {/* MAIN STAGE AREA — full width on mobile (fullscreen), remainder of row on desktop */}
    <div className={cn("flex-1 h-full min-w-0", portraitMode ? "hidden" : "flex")}>
      <SlideViewer
        slide={currentSlide}
        template={template}
        slideNumber={safeIndex}
        totalSlides={totalSlides}
        onNext={canNavigate ? goToNext : undefined}
        onPrev={canNavigate ? goToPrev : undefined}
      />
    </div>

    {/* PORTRAIT STAGE — mobile only, when NOT fullscreen.
        "Monitor-in-a-monitor": main monitor on top (slide, or the promoted
        participant's camera) + a horizontally-scrollable rail of preview
        monitors below. One <div id="remote-{uid}"> per participant: the
        featured member lives in the main monitor, everyone else in the rail. */}
    {portraitMode && (
      <div className="flex-1 h-full min-w-0 flex flex-col bg-zinc-950 overflow-y-auto">
        <div className="shrink-0 w-full max-w-3xl mx-auto aspect-video flex items-center bg-zinc-800">
          {featuredUid != null ? (
            <div className="relative w-full h-full">
              <div id={`remote-${featuredUid}`} className="w-full h-full bg-zinc-800" />
              <button
                onClick={onExitFeatured}
                className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/60 hover:bg-black/80 px-2.5 h-6 text-[11px] text-white border border-zinc-600"
              >
                ✕ Show Slide
              </button>
            </div>
          ) : (
            <SlideViewer
              slide={currentSlide}
              template={template}
              slideNumber={safeIndex}
              totalSlides={totalSlides}
              onNext={canNavigate ? goToNext : undefined}
              onPrev={canNavigate ? goToPrev : undefined}
            />
          )}
        </div>

        {remoteUsers.length > 0 && (
          <div className="shrink-0 w-full px-3 py-3">
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1">
              {remoteUsers
                .filter((u) => String(u.uid) !== String(featuredUid))
                .map((u) => (
                  <button
                    key={String(u.uid)}
                    type="button"
                    onClick={() => onPromote?.(u.uid)}
                    className="snap-start shrink-0 w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 focus:outline-none active:border-zinc-400"
                  >
                    <div id={`remote-${u.uid}`} className="w-full h-full" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    )}

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
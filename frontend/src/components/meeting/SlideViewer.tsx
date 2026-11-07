"use client";

import { useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TEMPLATE_STYLES,
  TEMPLATE_PALETTES,
  DEFAULT_PALETTE,
  type TemplatePalette,
} from "@/lib/presentation-templates";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Slide } from "@/types/educator/presentation.types";

interface Props {
  slide: Slide | null;
  template: string;
  slideNumber: number;
  totalSlides: number;
  onNext?: () => void;
  onPrev?: () => void;
}

const SWIPE_MIN_DISTANCE = 50;

function MobileSlideBackground({ palette }: { palette: TemplatePalette }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polygon points="0,0 70,0 0,24" fill={palette[0]} />
      <polygon points="0,0 44,0 0,15" fill={palette[1]} />
      <polygon points="0,0 22,0 0,8" fill={palette[2]} />
      <polygon points="100,100 30,100 100,76" fill={palette[0]} />
      <polygon points="100,100 56,100 100,85" fill={palette[1]} />
      <polygon points="100,100 78,100 100,92" fill={palette[2]} />
    </svg>
  );
}

export default function SlideViewer({
  slide,
  template,
  slideNumber,
  totalSlides,
  onNext,
  onPrev,
}: Props) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const cleanTitle = slide?.title
    ?.replace(/^Slide\s+\d+\s*[-:.]?\s*/i, "")
    ?.trim();
  const hasNav = !!onNext && !!onPrev;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (!hasNav) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onNext?.();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onPrev?.();
      } else if (e.key === " ") {
        e.preventDefault();
        onNext?.();
      }
    },
    [hasNav, onNext, onPrev],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch || !hasNav) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.5) return;

    if (dx < 0 && slideNumber < totalSlides - 1) onNext?.();
    if (dx > 0 && slideNumber > 0) onPrev?.();
  };

  const templateStyle = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.green;
  const palette = TEMPLATE_PALETTES[template] ?? DEFAULT_PALETTE;

  const prevButton = hasNav && slideNumber > 0 && (
    <button
      onClick={onPrev}
      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all z-10"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );

  const nextButton = hasNav && slideNumber < totalSlides - 1 && (
    <button
      onClick={onNext}
      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all z-10"
    >
      <ChevronRight className="h-6 w-6" />
    </button>
  );

  if (isMobile) {
    const containerStyle = { containerType: "size" } as React.CSSProperties;

    return (
      <div
        className="flex-1 relative overflow-hidden bg-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <MobileSlideBackground palette={palette} />

        <div className="absolute inset-0" style={containerStyle}>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ padding: "12cqh 9cqw" }}
          >
            {slide ? (
              <div className="max-h-full w-full overflow-y-auto text-center">
                {cleanTitle && (
                  <h1
                    className="font-bold text-neutral-900"
                    style={{
                      fontSize: "clamp(16px, 7cqmin, 40px)",
                      lineHeight: 1.2,
                      marginBottom: "3cqmin",
                    }}
                  >
                    {cleanTitle}
                  </h1>
                )}
                <p
                  className="text-neutral-800"
                  style={{
                    fontSize: "clamp(11px, 4cqmin, 22px)",
                    lineHeight: 1.5,
                  }}
                >
                  {slide.content}
                </p>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No content</p>
            )}
          </div>
        </div>

        {hasNav && slideNumber > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/25 text-white z-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {hasNav && slideNumber < totalSlides - 1 && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/25 text-white z-10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-zinc-800">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${templateStyle.image})` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          {slide ? (
            <>
              {cleanTitle && (
                <h1 className="text-4xl font-bold text-neutral-900 mb-6 text-center max-w-2xl">
                  {cleanTitle}
                </h1>
              )}
              <p className="text-xl text-neutral-800 text-center max-w-3xl leading-relaxed">
                {slide.content}
              </p>
            </>
          ) : (
            <p className="text-neutral-500 text-lg">No content</p>
          )}
        </div>
      </div>

      {prevButton}
      {nextButton}
    </div>
  );
}
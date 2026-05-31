"use client";

import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import type { Slide } from "@/types/educator/presentation.types";

interface Props {
  slide: Slide | null;
  template: string;
  slideNumber: number;
  totalSlides: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function SlideViewer({ slide, template, slideNumber, totalSlides, onNext, onPrev }: Props) {
  const cleanTitle = slide?.title?.replace(/^Slide\s+\d+\s*[-:.]?\s*/i, "")?.trim();
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

  const templateStyle = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES.green;

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

      {hasNav && slideNumber > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all z-10"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {hasNav && slideNumber < totalSlides - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all z-10"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}


    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import type { Slide } from "@/types/educator/presentation.types";

interface Props {
  slides: Slide[];
  currentSlideIndex: number;
  template?: string;
  onSelect?: (index: number) => void;
  /** "rail" = vertical left rail (desktop). "filmstrip" = horizontal row (mobile sheet). */
  variant?: "rail" | "filmstrip";
}

export default function SlideThumbnails({ slides, currentSlideIndex, template, onSelect, variant = "rail" }: Props) {
  const canSelect = !!onSelect;
  const templateStyle = TEMPLATE_STYLES[template ?? "green"] ?? TEMPLATE_STYLES.green;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Keep the active slide thumbnail in view as the slide changes
  useEffect(() => {
    if (variant !== "rail") return;
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) return;

    const containerTop = container.getBoundingClientRect().top;
    const containerBottom = container.getBoundingClientRect().bottom;
    const activeTop = active.getBoundingClientRect().top;
    const activeBottom = active.getBoundingClientRect().bottom;
    const PADDING = 8;

    if (activeTop < containerTop + PADDING) {
      container.scrollTop -= (containerTop + PADDING) - activeTop;
    } else if (activeBottom > containerBottom - PADDING) {
      container.scrollTop += activeBottom - (containerBottom - PADDING);
    }
  }, [currentSlideIndex, variant]);

  const cleanTitle = (slide: Slide) =>
    slide.title?.replace(/^Slide\s+\d+\s*[-:.]?\s*/i, "")?.trim();

  const thumbnail = (slide: Slide, i: number, isActive: boolean) => (
    <div
      key={slide.id}
      ref={i === currentSlideIndex ? activeRef : undefined}
      onClick={canSelect ? () => onSelect(i) : undefined}
      className={cn(
        "relative rounded-lg overflow-hidden transition-all",
        canSelect && "cursor-pointer",
        isActive
          ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
          : canSelect ? "hover:ring-1 hover:ring-border" : "",
      )}
    >
      <div
        className="w-full aspect-video bg-cover bg-center"
        style={{ backgroundImage: `url(${templateStyle.image})` }}
      >
        <div className="w-full h-full p-2 flex flex-col justify-center items-center bg-black/10">
          {cleanTitle(slide) && (
            <p className="text-[9px] font-bold text-neutral-900 text-center leading-tight line-clamp-2 mb-0.5">
              {cleanTitle(slide)}
            </p>
          )}
          <p className="text-[7px] text-neutral-800 text-center leading-tight line-clamp-3">
            {slide.content}
          </p>
        </div>
      </div>
    </div>
  );

  if (variant === "filmstrip") {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">Slides</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentSlideIndex + 1}/{slides.length}
          </span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2">
          {slides.map((slide, i) => thumbnail(slide, i, i === currentSlideIndex))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">Slides</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {currentSlideIndex + 1}/{slides.length}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, i) => thumbnail(slide, i, i === currentSlideIndex))}
      </div>
    </div>
  );
}

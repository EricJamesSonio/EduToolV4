"use client";

import { cn } from "@/lib/utils";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import type { Slide } from "@/types/educator/presentation.types";

interface Props {
  slides: Slide[];
  currentSlideIndex: number;
  template?: string;
  onSelect?: (index: number) => void;
}

export default function SlideThumbnails({ slides, currentSlideIndex, template, onSelect }: Props) {
  const canSelect = !!onSelect;
  const templateStyle = TEMPLATE_STYLES[template ?? "green"] ?? TEMPLATE_STYLES.green;
  return (
    <div className="w-56 border-r border-zinc-800 bg-zinc-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-sm font-medium text-white">Slides</span>
        <span className="text-xs text-zinc-500">{slides.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            onClick={canSelect ? () => onSelect(i) : undefined}
            className={cn(
              "relative rounded-lg overflow-hidden transition-all",
              canSelect && "cursor-pointer",
              i === currentSlideIndex
                ? "ring-2 ring-primary ring-offset-2 ring-offset-zinc-900"
                : canSelect ? "hover:ring-1 hover:ring-zinc-600" : "",
            )}
          >
            <div
              className="w-full aspect-video bg-cover bg-center"
              style={{ backgroundImage: `url(${templateStyle.image})` }}
            >
              <div className="w-full h-full p-2 flex flex-col justify-center items-center bg-black/10">
                {slide.title && (
                  <p className="text-[9px] font-bold text-neutral-900 text-center leading-tight line-clamp-2 mb-0.5">
                    {slide.title}
                  </p>
                )}
                <p className="text-[7px] text-neutral-800 text-center leading-tight line-clamp-3">
                  {slide.content}
                </p>
              </div>
            </div>
            <span className="absolute top-1 left-1 h-4 w-4 flex items-center justify-center rounded bg-black/50 text-[8px] font-semibold text-white">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

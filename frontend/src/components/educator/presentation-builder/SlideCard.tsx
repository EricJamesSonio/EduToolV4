// src/components/educator/presentation-builder/SlideCard.tsx
"use client";

import { Edit3, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlideDraft, FONT_FAMILIES, SLIDE_COLORS } from "./types";

interface SlideCardProps {
  slide:      SlideDraft;
  index:      number;
  total:      number;
  onEditOpen: () => void;
  onMove:     (direction: "up" | "down") => void;
  onDelete:   () => void;
}

export function SlideCard({
  slide, index, total, onEditOpen, onMove, onDelete,
}: SlideCardProps) {
  const color       = SLIDE_COLORS[index % SLIDE_COLORS.length];
  const currentFont = FONT_FAMILIES.find((f) => f.value === slide.fontFamily);

  return (
    <div className="px-3 py-2 group hover:bg-muted/40 transition-colors">
      <div className="flex items-start gap-2">

        {/* Number + reorder */}
        <div className={cn("flex flex-col items-center gap-0.5 pt-1 px-1 rounded shrink-0", color.bg)}>
          <button
            onClick={() => onMove("up")}
            disabled={index === 0}
            className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronLeft className="h-3 w-3 rotate-90" />
          </button>
          <span className="text-[10px] font-mono font-bold">{slide.slideNumber}</span>
          <button
            onClick={() => onMove("down")}
            disabled={index === total - 1}
            className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
          >
            <ChevronRight className="h-3 w-3 rotate-90" />
          </button>
        </div>

        {/* Content (view only) */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1">
            <p
              className="text-xs font-medium truncate flex-1"
              style={{ fontFamily: currentFont?.stack }}
            >
              {slide.title}
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <button
                onClick={onEditOpen}
                className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                title="Edit slide"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                onClick={onDelete}
                className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive"
                title="Delete slide"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <p
            className="text-[11px] text-muted-foreground line-clamp-2"
            style={{ fontFamily: currentFont?.stack }}
          >
            {slide.content || "(empty)"}
          </p>

          <div className="flex items-center gap-2">
            {slide.fontSize !== "md" && (
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
                Size: {slide.fontSize}
              </span>
            )}
            {slide.fontFamily !== "default" && (
              <span
                className="text-[9px] text-muted-foreground/60 uppercase tracking-wide"
                style={{ fontFamily: currentFont?.stack }}
              >
                {currentFont?.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
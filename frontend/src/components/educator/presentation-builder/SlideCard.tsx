"use client";

import { Edit3, Trash2, ChevronLeft, ChevronRight, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SlideDraft, FontSize, FONT_SIZES, SLIDE_COLORS } from "./types";

interface SlideCardProps {
  slide: SlideDraft;
  index: number;
  total: number;
  isEditing: boolean;
  onEditOpen: () => void;
  onEditClose: () => void;
  onUpdate: (field: "title" | "content", value: string) => void;
  onFontSize: (size: FontSize) => void;
  onMove: (direction: "up" | "down") => void;
  onDelete: () => void;
}

export function SlideCard({
  slide, index, total, isEditing,
  onEditOpen, onEditClose, onUpdate, onFontSize, onMove, onDelete,
}: SlideCardProps) {
  const color = SLIDE_COLORS[index % SLIDE_COLORS.length];

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

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {isEditing ? (
            <>
              <Input
                value={slide.title}
                onChange={(e) => onUpdate("title", e.target.value)}
                className="h-7 text-xs"
                placeholder="Slide title"
              />
              <Textarea
                value={slide.content}
                onChange={(e) => onUpdate("content", e.target.value)}
                className="min-h-[60px] text-xs"
                placeholder="Slide content"
              />
              <div className="flex items-center gap-1.5">
                <Type className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground">Font:</span>
                <div className="flex gap-1">
                  {FONT_SIZES.map((fs) => (
                    <button
                      key={fs.value}
                      onClick={() => onFontSize(fs.value)}
                      className={cn(
                        "h-5 px-1.5 rounded text-[10px] font-medium border transition-all",
                        slide.fontSize === fs.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground/50",
                      )}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onEditClose}>Done</Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium truncate flex-1">{slide.title}</p>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={onEditOpen}
                    className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={onDelete}
                    className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{slide.content || "(empty)"}</p>
              {slide.fontSize !== "md" && (
                <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
                  Font: {slide.fontSize}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
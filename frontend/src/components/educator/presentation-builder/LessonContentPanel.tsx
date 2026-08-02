"use client";

import { useRef } from "react";
import { Loader2, Wand2, Crosshair, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SlideDraft, WordSeg, SLIDE_COLORS } from "./types";

interface SlideRange {
  slideNumber: number;
  start: number;
  end: number;
}

interface LessonContentPanelProps {
  detail: string | null | undefined;
  description: string | null | undefined;
  words: WordSeg[];
  slides: SlideDraft[];
  slideRanges: Array<SlideRange | null>;
  selMode: boolean;
  startWordIdx: number | null;
  endWordIdx: number | null;
  hoverWordIdx: number | null;
  onEnterSelMode: () => void;
  onCancelSel: () => void;
  onConfirmSel: () => void;
  onWordClick: (idx: number) => void;
  onWordHover: (idx: number) => void;
  onAutoGenerate: () => void;
  isAutoGenerating: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function LessonContentPanel({
  detail, description, words, slides, slideRanges,
  selMode, startWordIdx, endWordIdx, hoverWordIdx,
  onEnterSelMode, onCancelSel, onConfirmSel,
  onWordClick, onWordHover, onAutoGenerate, isAutoGenerating, scrollRef,
}: LessonContentPanelProps) {
  const hasDetail = !!detail;
  const hasSelection = startWordIdx !== null && endWordIdx !== null;

  function getSlideIdxForWord(wordIdx: number): number | null {
    const seg = words[wordIdx];
    if (!seg) return null;
    for (let i = 0; i < slideRanges.length; i++) {
      const r = slideRanges[i];
      if (r && seg.start >= r.start && seg.end <= r.end) return i;
    }
    return null;
  }

  function renderWords() {
    if (!detail || words.length === 0) return <span>{detail ?? ""}</span>;

    const selLo = startWordIdx !== null && endWordIdx !== null ? Math.min(startWordIdx, endWordIdx) : null;
    const selHi = startWordIdx !== null && endWordIdx !== null ? Math.max(startWordIdx, endWordIdx) : null;
    const previewLo = startWordIdx !== null && endWordIdx === null && hoverWordIdx !== null ? Math.min(startWordIdx, hoverWordIdx) : null;
    const previewHi = startWordIdx !== null && endWordIdx === null && hoverWordIdx !== null ? Math.max(startWordIdx, hoverWordIdx) : null;

    return (
      <span>
        {description && (
          <div className="text-muted-foreground italic mb-3 pb-3 border-b">{description}</div>
        )}
        {words.map((seg, idx) => {
          const isHovered = selMode && endWordIdx === null && hoverWordIdx === idx;
          const isStarted = selMode && startWordIdx === idx;
          const isSelected = selLo !== null && selHi !== null && idx >= selLo && idx <= selHi;
          const isPreview = previewLo !== null && previewHi !== null && idx >= previewLo && idx <= previewHi && !isSelected;
          const slideIdx = getSlideIdxForWord(idx);
          const color = slideIdx !== null ? SLIDE_COLORS[slideIdx % SLIDE_COLORS.length] : null;
          const isSlideWord = !isSelected && !isPreview && color;

          return (
            <span
              key={idx}
              data-widx={idx}
              onClick={selMode ? () => onWordClick(idx) : undefined}
              onMouseEnter={selMode ? () => onWordHover(idx) : undefined}
              className={cn(
                "inline whitespace-pre-wrap rounded-sm transition-all",
                selMode && "cursor-pointer",
                selMode && isHovered && !isStarted && "bg-muted-foreground/10 ring-1 ring-muted-foreground/20",
                selMode && isStarted && !isSelected && !isPreview && (endWordIdx === null ? "ring-2 ring-yellow-500 bg-yellow-100 dark:bg-yellow-900/30" : "bg-primary/25"),
                selMode && isPreview && "bg-primary/10",
                selMode && isSelected && "bg-primary/25 text-foreground",
                isSlideWord && `${color.bg} ring-1 ${color.ring}`,
              )}
              title={slideIdx !== null ? `Slide ${slideIdx + 1}` : undefined}
            >
              {selMode && isStarted && endWordIdx === null && (
                <span className="inline-flex items-center gap-0.5 align-middle text-[9px] font-semibold text-yellow-600 dark:text-yellow-400 mr-0.5">
                  <Crosshair className="h-2.5 w-2.5" />
                </span>
              )}
              {seg.word}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <Card size="sm" className="p-0 gap-0">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Lesson Content</CardTitle>
          <div className="flex items-center gap-1">
            {selMode ? (
              <>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancelSel}>Cancel</Button>
                <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={onConfirmSel} disabled={!hasSelection}>
                  <Check className="h-3 w-3" /> Create Slide {slides.length + 1}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onEnterSelMode} disabled={!hasDetail}>
                <Crosshair className="h-3 w-3" /> Add Slide {slides.length + 1}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className={cn(
            "max-h-[500px] overflow-y-auto p-4 whitespace-pre-wrap text-sm leading-relaxed select-none",
            selMode && "ring-2 ring-inset ring-primary/40",
          )}
        >
          {hasDetail
            ? renderWords()
            : <p className="text-muted-foreground text-center py-8">No lesson content yet.</p>}
        </div>

        {selMode && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-4 py-2 border-t">
            <Crosshair className="h-3 w-3 shrink-0" />
            {startWordIdx === null && "Click any word to mark it as the start of the slide."}
            {startWordIdx !== null && endWordIdx === null && "Now click another word to mark the end."}
            {startWordIdx !== null && endWordIdx !== null && "Selection complete — click Create Slide to confirm."}
          </div>
        )}

        {slides.length > 0 && !selMode && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-t">
            {slides.map((s, i) => {
              const c = SLIDE_COLORS[i % SLIDE_COLORS.length];
              return (
                <span key={s.id} className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", c.bg)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  Slide {i + 1}
                </span>
              );
            })}
          </div>
        )}

        <div className="px-4 py-3 border-t">
          <Button variant="secondary" size="sm" className="gap-1.5 w-full" onClick={onAutoGenerate} disabled={isAutoGenerating}>
            {isAutoGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            Auto-Generate Slides
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
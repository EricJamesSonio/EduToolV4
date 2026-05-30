"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlideDraft } from "./types";
import { getFontSizeTextClass } from "./utils";

interface PreviewModalProps {
  slides: SlideDraft[];
  templateImage: string;
  currentSlide: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PreviewModal({ slides, templateImage, currentSlide, onClose, onNavigate }: PreviewModalProps) {
  const slide = slides[currentSlide];
  if (!slide) return null;
  const hideTitle = /^Slide \d+$/i.test(slide.title);
  const textClass = getFontSizeTextClass(slide.fontSize);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div
        className="relative w-full max-w-4xl mx-4 rounded-xl shadow-2xl overflow-hidden bg-cover bg-center"
        style={{ aspectRatio: "16/9", backgroundImage: `url(${templateImage})` }}
      >
        <div className="absolute top-0 inset-x-0 h-10 bg-zinc-900/60 flex items-center justify-between px-4 z-10">
          <span className="text-xs text-white/80">Slide {currentSlide + 1} / {slides.length}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">&times;</button>
        </div>

        <div className="relative z-[5] h-full flex flex-col items-center justify-center p-8 md:p-16 text-center text-white drop-shadow-lg">
          {!hideTitle && (
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">{slide.title}</h2>
          )}
          <p className={cn("whitespace-pre-wrap max-w-3xl leading-relaxed", textClass)}>
            {slide.content}
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-12 bg-zinc-900/60 flex items-center justify-between px-4 z-10">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" onClick={() => onNavigate(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button key={i} onClick={() => onNavigate(i)} className={cn("h-1.5 rounded-full transition-all", i === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
            ))}
          </div>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white" onClick={() => onNavigate(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Maximize, Minimize, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { presentationApi } from "@/api/educator/presentation.api";
import type { Presentation } from "@/types/educator/presentation.types";

export default function PresentationViewerPage(): React.JSX.Element {
  const { classId, presentationId } = useParams<{ classId: string; presentationId: string }>();
  const router = useRouter();
  const [pres, setPres] = useState<Presentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !presentationId) return;
    setLoading(true);
    presentationApi
      .getOne(classId, presentationId)
      .then((p) => {
        setPres(p);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load presentation");
        setLoading(false);
      });
  }, [classId, presentationId]);

  const goTo = useCallback((i: number) => {
    if (!pres) return;
    setSlide(Math.max(0, Math.min(i, pres.slides.length - 1)));
  }, [pres]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goTo(slide + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(slide - 1);
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide, goTo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !pres) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-destructive">{error ?? "Presentation not found"}</p>
          <Button variant="outline" size="sm" onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (pres.slides.length === 0) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">This presentation has no slides.</p>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/educator/classes/${classId}/presentations/new?lessonId=${pres.lessonId}`)}
          >
            Edit Presentation
          </Button>
        </div>
      </div>
    );
  }

  const currentSlide = pres.slides[slide];

  return (
    <div className="flex flex-col items-center">
      {/* Top bar */}
      <div className="w-full max-w-5xl flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/educator/classes/${classId}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">{pres.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">
            {slide + 1} / {pres.slides.length}
          </span>
          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Slide */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-white shadow-lg",
          isFullscreen ? "h-[100vh] rounded-none border-none shadow-none" : "max-w-5xl",
          "flex-1"
        )}
        style={{ aspectRatio: isFullscreen ? undefined : "16/9" }}
      >
        {/* Slide content */}
        <div className="h-full flex flex-col items-center justify-center p-8 md:p-16 text-center">
          {currentSlide.title && (
            <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 text-zinc-900">
              {currentSlide.title}
            </h2>
          )}
          {currentSlide.content && (
            <p className="text-base md:text-xl text-zinc-600 whitespace-pre-wrap max-w-3xl leading-relaxed">
              {currentSlide.content}
            </p>
          )}
        </div>

        {/* Navigation arrows */}
        {slide > 0 && (
          <button
            onClick={() => goTo(slide - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-zinc-700 transition-all opacity-0 hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {slide < pres.slides.length - 1 && (
          <button
            onClick={() => goTo(slide + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-zinc-700 transition-all opacity-0 hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mt-4 mb-8">
        {pres.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 rounded-full transition-all",
              i === slide ? "w-6 bg-primary" : "w-2 bg-zinc-300 hover:bg-zinc-400"
            )}
          />
        ))}
      </div>
    </div>
  );
}

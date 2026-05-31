// src/components/educator/presentation-builder/SlideOrganizer.tsx
"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlideCard } from "./SlideCard";
import { SlideEditModal } from "./SlideEditModal";
import { type SlideDraft, type FontSize, type FontFamily } from "./types";

interface SlideOrganizerProps {
  slides:       SlideDraft[];
  onUpdate:     (id: string, field: "title" | "content", value: string) => void;
  onFontSize:   (id: string, size: FontSize) => void;
  onFontFamily: (id: string, family: FontFamily) => void;
  onMove:       (index: number, direction: "up" | "down") => void;
  onDelete:     (id: string) => void;
}

export function SlideOrganizer({
  slides, onUpdate, onFontSize, onFontFamily, onMove, onDelete,
}: SlideOrganizerProps) {
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const editingSlide = slides.find((s) => s.id === editingSlideId) ?? null;

  function handleSave(patch: {
    title: string; content: string; fontSize: FontSize; fontFamily: FontFamily;
  }) {
    if (!editingSlideId) return;
    onUpdate(editingSlideId, "title",   patch.title);
    onUpdate(editingSlideId, "content", patch.content);
    onFontSize(editingSlideId,   patch.fontSize);
    onFontFamily(editingSlideId, patch.fontFamily);
  }

  return (
    <>
      <div className="rounded-xl border bg-card flex flex-col" style={{ minHeight: 400 }}>
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <p className="text-sm font-semibold">Slides ({slides.length})</p>
        </div>

        <ScrollArea className="flex-1">
          {slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-sm text-muted-foreground">No slides yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select text from the lesson to create a slide, or use Auto-generate.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {slides.map((slide, index) => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  total={slides.length}
                  onEditOpen={() => setEditingSlideId(slide.id)}
                  onMove={(dir) => onMove(index, dir)}
                  onDelete={() => onDelete(slide.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {editingSlide && (
        <SlideEditModal
          slide={editingSlide}
          onSave={handleSave}
          onClose={() => setEditingSlideId(null)}
        />
      )}
    </>
  );
}
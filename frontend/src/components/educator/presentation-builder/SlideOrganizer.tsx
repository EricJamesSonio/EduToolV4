"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlideCard } from "./SlideCard";
import { SlideDraft, FontSize } from "./types";

interface SlideOrganizerProps {
  slides: SlideDraft[];
  editingSlideId: string | null;
  onEditOpen: (id: string) => void;
  onEditClose: () => void;
  onUpdate: (id: string, field: "title" | "content", value: string) => void;
  onFontSize: (id: string, size: FontSize) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDelete: (id: string) => void;
}

export function SlideOrganizer({
  slides, editingSlideId, onEditOpen, onEditClose,
  onUpdate, onFontSize, onMove, onDelete,
}: SlideOrganizerProps) {
  return (
    <Card size="sm" className="p-0 gap-0">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-sm">Slides ({slides.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border max-h-[540px] overflow-y-auto">
          {slides.length === 0 ? (
            <div className="px-4 py-12 text-sm text-muted-foreground text-center">
              <p>No slides yet.</p>
              <p className="text-xs mt-1">
                Click <strong>Add Slide 1</strong>, then click a word to start and another to end.
              </p>
            </div>
          ) : (
            slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                total={slides.length}
                isEditing={editingSlideId === slide.id}
                onEditOpen={() => onEditOpen(slide.id)}
                onEditClose={onEditClose}
                onUpdate={(field, value) => onUpdate(slide.id, field, value)}
                onFontSize={(size) => onFontSize(slide.id, size)}
                onMove={(dir) => onMove(i, dir)}
                onDelete={() => onDelete(slide.id)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// src/components/educator/presentation-builder/SlideEditModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Type } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  SlideDraft, FontSize, FontFamily,
  FONT_SIZES, FONT_FAMILIES, getFontStack,
} from "./types";

interface SlideEditModalProps {
  slide:       SlideDraft;
  onSave:      (patch: { title: string; content: string; fontSize: FontSize; fontFamily: FontFamily }) => void;
  onClose:     () => void;
}

export function SlideEditModal({ slide, onSave, onClose }: SlideEditModalProps) {
  const [title,      setTitle]      = useState(slide.title);
  const [content,    setContent]    = useState(slide.content);
  const [fontSize,   setFontSize]   = useState<FontSize>(slide.fontSize);
  const [fontFamily, setFontFamily] = useState<FontFamily>(slide.fontFamily);

  // Sync if slide prop changes (e.g. switching between slides)
  useEffect(() => {
    setTitle(slide.title);
    setContent(slide.content);
    setFontSize(slide.fontSize);
    setFontFamily(slide.fontFamily);
  }, [slide.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSave() {
    onSave({ title: title.trim(), content: content.trim(), fontSize, fontFamily });
    onClose();
  }

  const previewFontStack = getFontStack(fontFamily);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <p className="text-sm font-semibold">Edit Slide {slide.slideNumber}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Changes apply to this slide only</p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="slide-title">Slide Title</Label>
            <Input
              id="slide-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Slide title"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="slide-content">Content</Label>
            <Textarea
              id="slide-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Slide content..."
              rows={6}
              style={{ fontFamily: previewFontStack }}
            />
          </div>

          {/* Font size */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Label>Font Size</Label>
            </div>
            <div className="flex gap-2">
              {FONT_SIZES.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => setFontSize(fs.value)}
                  className={cn(
                    "flex-1 h-9 rounded-lg border text-sm font-medium transition-all",
                    fontSize === fs.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
                  )}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font family */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Label>Font Style</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FONT_FAMILIES.map((ff) => (
                <button
                  key={ff.value}
                  onClick={() => setFontFamily(ff.value)}
                  className={cn(
                    "h-10 px-3 rounded-lg border text-sm transition-all text-left",
                    fontFamily === ff.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
                  )}
                  style={{ fontFamily: ff.stack }}
                >
                  {ff.label}
                  <span
                    className="ml-2 text-xs opacity-60"
                    style={{ fontFamily: ff.stack }}
                  >
                    Aa
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview strip */}
          <div className="space-y-1.5">
            <Label>Preview</Label>
            <div
              className="rounded-lg border bg-muted/30 px-4 py-3 min-h-[60px]"
              style={{ fontFamily: previewFontStack }}
            >
              {title && (
                <p className="text-sm font-bold mb-1 truncate">{title}</p>
              )}
              <p
                className={cn(
                  "text-muted-foreground whitespace-pre-wrap line-clamp-3",
                  FONT_SIZES.find((f) => f.value === fontSize)?.textClass ?? "text-sm",
                )}
              >
                {content || "(empty)"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
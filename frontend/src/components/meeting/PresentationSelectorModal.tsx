"use client";

import { useState } from "react";
import { Monitor, MonitorPlay } from "lucide-react";
import { usePresentations } from "@/hooks/educator/usePresentations";
import { TEMPLATE_STYLES } from "@/lib/presentation-templates";
import type { Presentation } from "@/types/educator/presentation.types";

type Mode = "lesson" | "screen";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (pres: Presentation) => void;
  onShareScreen: () => void;
  classId: string;
}

export default function PresentationSelectorModal({ open, onClose, onSelect, onShareScreen, classId }: Props) {
  const { data: presentations, isLoading } = usePresentations(classId);
  const [mode, setMode] = useState<Mode>("lesson");

  if (!open) return null;

  const handleShareScreen = async () => {
    onClose();
    onShareScreen();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Present</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 px-4 pt-3 pb-1">
          <button
            onClick={() => setMode("lesson")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
              mode === "lesson"
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <MonitorPlay className="h-4 w-4" />
            Lesson Presentation
          </button>
          <button
            onClick={() => setMode("screen")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${
              mode === "screen"
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Monitor className="h-4 w-4" />
            Share Screen
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3">
          {mode === "lesson" ? (
            <div className="space-y-2">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading presentations...</p>
              ) : !presentations || presentations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No presentations yet for this class.</p>
              ) : (
                presentations.map((pres) => (
                  <button
                    key={pres.id}
                    onClick={() => { onSelect(pres); onClose(); }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-lg bg-muted/60 hover:bg-muted border border-transparent hover:border-border transition-all text-left"
                  >
                    <div className="h-14 w-20 rounded-md overflow-hidden shrink-0 bg-muted">
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${TEMPLATE_STYLES[pres.template]?.image ?? TEMPLATE_STYLES.green.image})` }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{pres.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pres.slides.length} slide{pres.slides.length !== 1 ? "s" : ""}
                        {" · "}
                        {TEMPLATE_STYLES[pres.template]?.label ?? "Default"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Monitor className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Share your screen</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Your entire screen will be visible to all participants in the meeting.
                </p>
              </div>
              <button
                onClick={handleShareScreen}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start Sharing
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
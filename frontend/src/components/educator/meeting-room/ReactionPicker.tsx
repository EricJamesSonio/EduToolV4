"use client";

import { REACTIONS } from "./types";

interface ReactionPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onPick, onClose }: ReactionPickerProps) {
  return (
    <div className="meeting-reaction-picker absolute bottom-16 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-xl px-3 py-2 flex gap-2 shadow-lg z-20">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onPick(emoji); onClose(); }}
          className="text-2xl hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
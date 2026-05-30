// src/components/educator/meeting-room/ReactionPicker.tsx
"use client";

import { ReactionPicker as BaseReactionPicker } from "@/components/meeting/ReactionPicker";
import { REACTIONS } from "./types";

interface ReactionPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ onPick, onClose }: ReactionPickerProps) {
  return <BaseReactionPicker reactions={REACTIONS} onPick={onPick} onClose={onClose} />;
}
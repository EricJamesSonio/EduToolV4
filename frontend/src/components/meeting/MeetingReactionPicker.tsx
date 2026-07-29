"use client";

import { ReactionPicker as BaseReactionPicker } from "@/components/meeting/ReactionPicker";

const REACTIONS = ["👍", "👏", "❤️", "😂", "😮", "🎉"] as const;

interface MeetingReactionPickerProps {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

export function MeetingReactionPicker({ onPick, onClose }: MeetingReactionPickerProps) {
  return <BaseReactionPicker reactions={REACTIONS} onPick={onPick} onClose={onClose} />;
}

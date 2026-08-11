"use client";

import { useEffect, useRef } from "react";
import type { GroupyMessage } from "@/types/groupy/groupy.types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: GroupyMessage[];
  currentUserId: string;
  role: "educator" | "student";
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reactionType: "like" | "love" | "laugh" | "wow" | "sad") => void;
  onRemoveReaction: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  role,
  hasOlder,
  loadingOlder,
  onLoadOlder,
  onDelete,
  onReact,
  onRemoveReaction,
}: MessageListProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const newestIdRef = useRef<string | null>(null);

  // Newest message id → jump to bottom when a new message arrives or on first load.
  const newestId = messages[messages.length - 1]?.id ?? null;
  useEffect(() => {
    if (!newestId) return;
    if (newestId !== newestIdRef.current) {
      newestIdRef.current = newestId;
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [newestId]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasOlder || loadingOlder) return;
    // Near the top → load an older page (cursor pagination backward).
    if (el.scrollTop < 60) {
      onLoadOlder();
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 space-y-3"
    >
      {hasOlder && (
        <div className="text-center">
          <button
            type="button"
            onClick={onLoadOlder}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {loadingOlder ? "Loading older messages..." : "Load older messages"}
          </button>
        </div>
      )}
      {messages.length === 0 && (
        <p className="text-xs text-muted-foreground text-center pt-4">
          No messages yet. Start the conversation!
        </p>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          currentUserId={currentUserId}
          role={role}
          onDelete={onDelete}
          onReact={onReact}
          onRemoveReaction={onRemoveReaction}
        />
      ))}
    </div>
  );
}
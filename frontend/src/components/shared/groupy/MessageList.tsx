"use client";

import { useCallback, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import type { GroupyMember, GroupyMessage } from "@/types/groupy/groupy.types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: GroupyMessage[];
  currentUserId: string;
  role: "educator" | "student";
  // Members (other than the current user) who have read the newest message.
  seenBy: GroupyMember[];
  // Id of the currently live groupy meeting (if any) so meeting messages can
  // show "ended" state once their meeting is gone.
  activeMeetingId: string | null;
  // Whether the active-meeting status has been confirmed (see MessageBubble).
  meetingStatusKnown: boolean;
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reactionType: "like" | "love" | "laugh" | "wow" | "sad") => void;
  onRemoveReaction: (messageId: string) => void;
  onAtBottomChange: (atBottom: boolean) => void;
}

const BOTTOM_THRESHOLD = 80;

export function MessageList({
  messages,
  currentUserId,
  role,
  seenBy,
  activeMeetingId,
  meetingStatusKnown,
  hasOlder,
  loadingOlder,
  onLoadOlder,
  onDelete,
  onReact,
  onRemoveReaction,
  onAtBottomChange,
}: MessageListProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const newestIdRef = useRef<string | null>(null);
  const nearBottomRef = useRef(true);

  // Newest message id (display order is oldest → newest, so it's the last item).
  const newestId = messages[messages.length - 1]?.id ?? null;

  const reportBottom = useCallback(
    (atBottom: boolean) => {
      if (nearBottomRef.current === atBottom) return;
      nearBottomRef.current = atBottom;
      onAtBottomChange(atBottom);
    },
    [onAtBottomChange]
  );

  // Jump to the bottom on first load, and on a new message only if the user is
  // already near the bottom (so reading older messages isn't interrupted and
  // unread state is preserved until they scroll down).
  useEffect(() => {
    if (!newestId) return;
    if (newestId !== newestIdRef.current) {
      newestIdRef.current = newestId;
      if (nearBottomRef.current) {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
        reportBottom(true);
      }
    }
  }, [newestId, reportBottom]);

  // Messenger-style infinite scroll up: keep filling in older messages until
  // the list is tall enough to actually scroll, then backfill as the user
  // reaches the top (see handleScroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasOlder || loadingOlder) return;
    if (el.scrollHeight <= el.clientHeight) onLoadOlder();
  }, [hasOlder, loadingOlder, messages.length, onLoadOlder]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    reportBottom(atBottom);

    if (hasOlder && !loadingOlder && el.scrollTop < 60) {
      onLoadOlder();
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 space-y-3"
    >
      {loadingOlder && (
        <div className="text-center py-1">
          <span className="text-[11px] text-muted-foreground">
            Loading older messages...
          </span>
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
          activeMeetingId={activeMeetingId}
          meetingStatusKnown={meetingStatusKnown}
          onDelete={onDelete}
          onReact={onReact}
          onRemoveReaction={onRemoveReaction}
        />
      ))}

      {seenBy.length > 0 && (
        <div className="flex justify-end gap-2 pt-1">
          <AvatarGroup>
            {seenBy.map((m) => {
              const name = m.full_name || "?";
              const initials = name
                .split(/\s+/)
                .map((p) => p[0])
                .filter(Boolean)
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Avatar key={m.account_id} title={name} className="h-6 w-6">
                  <AvatarImage src={getProfileImageUrl(m.profile_image)} alt={name} />
                  <AvatarFallback className="text-[10px]">{initials || "?"}</AvatarFallback>
                </Avatar>
              );
            })}
          </AvatarGroup>
        </div>
      )}
    </div>
  );
}
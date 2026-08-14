"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { getProfileImageUrl } from "@/utils/profile.util";
import type {
  GroupyMessage,
  GroupyReactionType,
} from "@/types/groupy/groupy.types";
import { useGroupyStickerAsset } from "@/hooks/groupy/useGroupyStickers";
import { PollMessageCard } from "./PollMessageCard";

interface MessageBubbleProps {
  message: GroupyMessage;
  currentUserId: string;
  role: "educator" | "student";
  // Id of the currently live groupy meeting (if any) for meeting messages.
  activeMeetingId: string | null;
  // Whether the active-meeting status has been confirmed yet. While unknown we
  // assume a meeting message is still joinable instead of showing "ended".
  meetingStatusKnown: boolean;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reactionType: GroupyReactionType) => void;
  onRemoveReaction: (messageId: string) => void;
}

const REACTIONS: { type: GroupyReactionType; emoji: string }[] = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
];

function GifBody({ url }: { url: string }) {
  return (
    <img
      src={url}
      alt="GIF"
      className="max-h-56 max-w-full rounded-md"
      loading="lazy"
    />
  );
}

function StickerBody({ stickerId }: { stickerId: string }) {
  const assetPath = useGroupyStickerAsset(stickerId);
  if (!assetPath) {
    return <span className="italic opacity-80">Sticker</span>;
  }
  return <img src={assetPath} alt="Sticker" className="h-20 w-20 object-cover" />;
}

function renderBody(
  message: GroupyMessage,
  currentUserId: string,
  role: "educator" | "student",
  activeMeetingId: string | null,
  meetingStatusKnown: boolean
): React.ReactNode {
  switch (message.type) {
    case "gif":
      return message.gif_url ? <GifBody url={message.gif_url} /> : null;
    case "sticker":
      return message.sticker_id ? <StickerBody stickerId={message.sticker_id} /> : null;
    case "poll":
      return <PollMessageCard message={message} currentUserId={currentUserId} />;
    case "system": {
      let meetingId = "";
      let title = "";
      try {
        const parsed = message.body ? JSON.parse(message.body) : null;
        meetingId = parsed?.meetingId ?? "";
        title = parsed?.title ?? "";
      } catch {
        // fall through to raw body
      }
      if (meetingId) {
        const base = role === "educator" ? "/educator" : "/student";
        const href = `${base}/classes/${message.class_id}/meetings/${meetingId}/room?origin=groupy`;
        const isLive = activeMeetingId === meetingId;
        const canJoin = isLive || !meetingStatusKnown;
        return (
          <div className="space-y-1.5">
            <p className="font-medium">{title || "A meeting has started"}.</p>
            {canJoin ? (
              <Link
                href={href}
                className="inline-block rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Join
              </Link>
            ) : (
              <p className="text-[11px] text-muted-foreground">This meeting has ended.</p>
            )}
          </div>
        );
      }
      return <span>{message.body}</span>;
    }
    default:
      return <span>{message.body}</span>;
  }
}

function messageCopyText(message: GroupyMessage): string {
  switch (message.type) {
    case "gif":
      return message.gif_url ?? "";
    case "poll":
      return message.body || "Poll message";
    case "sticker":
      return message.body || "Sticker message";
    default:
      return message.body ?? "";
  }
}

function SenderAvatar({ message }: { message: GroupyMessage }) {
  const name = message.sender_name || "?";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Avatar className="mt-0.5 h-8 w-8 shrink-0">
      <AvatarImage src={getProfileImageUrl(message.sender_profile_image)} alt={name} />
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}

// Compact reaction count badges shown inside the bubble (only reactions that
// actually exist). Clicking a badge re-triggers it for me (toggles it off if it
// is already mine).
function ReactionBadges({
  reactions,
  currentUserId,
  onReact,
}: {
  reactions: GroupyMessage["reactions"];
  currentUserId: string;
  onReact: (reactionType: GroupyReactionType) => void;
}) {
  const myReaction = reactions.find((r) => r.account_id === currentUserId);
  const withCounts = REACTIONS.map(({ type, emoji }) => ({
    type,
    emoji,
    count: reactions.filter((r) => r.reaction_type === type).length,
  })).filter((r) => r.count > 0);

  if (withCounts.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap justify-end gap-1">
      {withCounts.map(({ type, emoji, count }) => {
        const isMine = myReaction?.reaction_type === type;
        return (
          <button
            key={type}
            type="button"
            title={type}
            onClick={(e) => {
              e.stopPropagation();
              onReact(type);
            }}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors",
              isMine
                ? "bg-background border-primary/50"
                : "bg-background border-border"
            )}
          >
            <span>{emoji}</span>
            <span className="text-muted-foreground">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MessageBubble({
  message,
  currentUserId,
  role,
  activeMeetingId,
  meetingStatusKnown,
  onDelete,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.sender_account_id === currentUserId;
  const isSystem = message.type === "system";

  const [menuOpen, setMenuOpen] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const myReaction = message.reactions.find((r) => r.account_id === currentUserId);

  const handleReactInMenu = (type: GroupyReactionType) => {
    setMenuOpen(false);
    if (myReaction?.reaction_type === type) {
      onRemoveReaction(message.id);
    } else {
      onReact(message.id, type);
    }
  };

  const handleCopy = async () => {
    setMenuOpen(false);
    const text = messageCopyText(message);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy message");
    }
  };

  const bubbleClasses = cn(
    "rounded-xl px-3 py-2 text-sm leading-relaxed break-words",
    isOwn
      ? "bg-primary text-primary-foreground rounded-tr-sm"
      : "bg-muted text-foreground border border-border rounded-tl-sm"
  );

  const bubble = (
    <div ref={bubbleRef} className={bubbleClasses}>
      {renderBody(message, currentUserId, role, activeMeetingId, meetingStatusKnown)}
      <ReactionBadges
        reactions={message.reactions}
        currentUserId={currentUserId}
        onReact={(t) => onReact(message.id, t)}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isSystem ? "justify-center" : isOwn ? "justify-end" : "justify-start"
      )}
    >
      {isSystem ? (
        <div className="max-w-[80%] min-w-0 rounded-lg bg-accent/40 border border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
          {renderBody(message, currentUserId, role, activeMeetingId, meetingStatusKnown)}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-start gap-2",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          {!isOwn && <SenderAvatar message={message} />}
          <div className="max-w-[80%] min-w-0 space-y-0.5">
            <p
              className={cn(
                "text-[11px] font-medium px-1 break-words",
                isOwn ? "text-muted-foreground text-right" : "text-muted-foreground"
              )}
            >
              {isOwn ? "You" : message.sender_name} · {time}
            </p>

            {message.type === "poll" ? (
              bubble
            ) : (
              <div className="cursor-pointer" onClick={() => setMenuOpen((v) => !v)}>
                <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                  {bubble}
                  <PopoverContent
                    anchor={bubbleRef}
                    side="top"
                    align={isOwn ? "end" : "start"}
                    sideOffset={6}
                    className="w-48 p-1"
                  >
                    <div className="grid grid-cols-5 gap-0.5 p-1">
                      {REACTIONS.map(({ type, emoji }) => {
                        const mine = myReaction?.reaction_type === type;
                        const count = message.reactions.filter((r) => r.reaction_type === type).length;
                        return (
                          <button
                            key={type}
                            type="button"
                            title={type}
                            onClick={() => handleReactInMenu(type)}
                            className={cn(
                              "flex flex-col items-center gap-0.5 rounded-md py-1 text-lg hover:bg-muted transition-colors cursor-pointer",
                              mine && "bg-primary/10 hover:bg-primary/15"
                            )}
                          >
                            <span>{emoji}</span>
                            {count > 0 && (
                              <span className="text-[9px] leading-none text-muted-foreground">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mx-1 my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => onDelete(message.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
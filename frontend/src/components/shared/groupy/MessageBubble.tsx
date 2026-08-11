"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import type { GroupyMessage } from "@/types/groupy/groupy.types";
import { useGroupyStickerAsset } from "@/hooks/groupy/useGroupyStickers";
import { ReactionBar } from "./ReactionBar";
import { PollMessageCard } from "./PollMessageCard";

interface MessageBubbleProps {
  message: GroupyMessage;
  currentUserId: string;
  role: "educator" | "student";
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, reactionType: "like" | "love" | "laugh" | "wow" | "sad") => void;
  onRemoveReaction: (messageId: string) => void;
}

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
  role: "educator" | "student"
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
        const href = `${base}/classes/${message.class_id}/meetings/${meetingId}/room`;
        return (
          <div className="space-y-1.5">
            <p className="font-medium">{title || "A meeting has started"}.</p>
            <Link
              href={href}
              className="inline-block rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Join
            </Link>
          </div>
        );
      }
      return <span>{message.body}</span>;
    }
    default:
      return <span>{message.body}</span>;
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

export function MessageBubble({
  message,
  currentUserId,
  role,
  onDelete,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.sender_account_id === currentUserId;
  const isSystem = message.type === "system";

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex w-full",
        isSystem ? "justify-center" : isOwn ? "justify-end" : "justify-start"
      )}
    >
      {isSystem ? (
        <div className="max-w-[85%] rounded-lg bg-accent/40 border border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
          {renderBody(message, currentUserId, role)}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-start gap-2",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          {!isOwn && <SenderAvatar message={message} />}
          <div className="max-w-[85%] space-y-0.5">
            <p
              className={cn(
                "text-[11px] font-medium px-1",
                isOwn ? "text-muted-foreground text-right" : "text-muted-foreground"
              )}
            >
              {isOwn ? "You" : message.sender_name} · {time}
            </p>
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed break-words",
                isOwn
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground border border-border rounded-tl-sm"
              )}
            >
              {renderBody(message, currentUserId, role)}
            </div>
            <div className={cn("flex items-center gap-2", isOwn && "justify-end")}>
              <ReactionBar
                messageId={message.id}
                currentUserId={currentUserId}
                reactions={message.reactions}
                onReact={(t) => onReact(message.id, t)}
                onRemove={() => onRemoveReaction(message.id)}
              />
              {isOwn && (
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
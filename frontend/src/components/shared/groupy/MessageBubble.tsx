"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Ellipsis, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfileImageUrl } from "@/utils/profile.util";
import type { GroupyMessage } from "@/types/groupy/groupy.types";
import { useGroupyStickerAsset } from "@/hooks/groupy/useGroupyStickers";
import { ReactionBar } from "./ReactionBar";
import { PollMessageCard } from "./PollMessageCard";

interface MessageBubbleProps {
  message: GroupyMessage;
  currentUserId: string;
  role: "educator" | "student";
  // Id of the currently live groupy meeting (if any) for meeting messages.
  activeMeetingId: string | null;
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
  role: "educator" | "student",
  activeMeetingId: string | null
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
        return (
          <div className="space-y-1.5">
            <p className="font-medium">{title || "A meeting has started"}.</p>
            {isLive ? (
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

// Messenger-style action menu (Copy / Delete) on own messages.
function MessageActions({
  message,
  isOwn,
  onDelete,
}: {
  message: GroupyMessage;
  isOwn: boolean;
  onDelete: () => void;
}): React.JSX.Element {
  const handleCopy = async () => {
    const text = messageCopyText(message);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy message");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Message actions"
        className="h-5 w-5 rounded-full text-muted-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 flex items-center justify-center hover:bg-muted transition-opacity outline-none"
      >
        <Ellipsis className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={handleCopy}>Copy</DropdownMenuItem>
        {isOwn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="flex items-center gap-1.5"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MessageBubble({
  message,
  currentUserId,
  role,
  activeMeetingId,
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
          {renderBody(message, currentUserId, role, activeMeetingId)}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-start gap-2",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          {!isOwn && <SenderAvatar message={message} />}
          <div className="max-w-[85%] flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1">
              <p
                className={cn(
                  "text-[11px] font-medium px-1",
                  isOwn ? "text-muted-foreground flex-1 text-right" : "text-muted-foreground"
                )}
              >
                {isOwn ? "You" : message.sender_name} · {time}
              </p>
              <MessageActions
                message={message}
                isOwn={isOwn}
                onDelete={() => onDelete(message.id)}
              />
            </div>
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-sm leading-relaxed break-words",
                isOwn
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground border border-border rounded-tl-sm"
              )}
            >
              {renderBody(message, currentUserId, role, activeMeetingId)}
            </div>
            <div className={cn("flex items-center gap-2", isOwn && "justify-end")}>
              <ReactionBar
                messageId={message.id}
                currentUserId={currentUserId}
                reactions={message.reactions}
                onReact={(t) => onReact(message.id, t)}
                onRemove={() => onRemoveReaction(message.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
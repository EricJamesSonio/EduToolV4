"use client";

import { cn } from "@/lib/utils";
import type {
  GroupyReaction,
  GroupyReactionType,
} from "@/types/groupy/groupy.types";

const REACTION_OPTIONS: { type: GroupyReactionType; emoji: string }[] = [
  { type: "like", emoji: "👍" },
  { type: "love", emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
];

interface ReactionBarProps {
  messageId: string;
  currentUserId: string;
  reactions: GroupyReaction[];
  onReact: (reactionType: GroupyReactionType) => void;
  onRemove: () => void;
}

export function ReactionBar({
  currentUserId,
  reactions,
  onReact,
  onRemove,
}: ReactionBarProps): React.JSX.Element {
  const myReaction = reactions.find((r) => r.account_id === currentUserId);

  return (
    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
      {REACTION_OPTIONS.map(({ type, emoji }) => {
        const count = reactions.filter((r) => r.reaction_type === type).length;
        const isMine = myReaction?.reaction_type === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => (isMine ? onRemove() : onReact(type))}
            title={type}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              isMine
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "bg-background border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { groupyApi } from "@/api/shared/groupy.api";
import { useGroupyPollDetail } from "@/hooks/groupy/useGroupyPollDetail";
import {
  applyPollClosed,
  applyPollSummary,
  groupyPollKey,
} from "@/hooks/groupy/groupyCache";
import type { GroupyMessage, GroupyPollDetail } from "@/types/groupy/groupy.types";

interface PollMessageCardProps {
  message: GroupyMessage;
  currentUserId: string;
}

export function PollMessageCard({
  message,
  currentUserId,
}: PollMessageCardProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const { data: poll, isLoading } = useGroupyPollDetail(message.poll_id);

  const isCreator = poll?.created_by === currentUserId;
  const disabled = !poll || poll.isClosed;

  const handleVote = async (optionId: string) => {
    if (!poll || poll.isClosed || !message.poll_id) return;
    try {
      const summary = await groupyApi.votePoll(message.poll_id, optionId);
      queryClient.setQueryData<GroupyPollDetail>(
        groupyPollKey(message.poll_id),
        (old) =>
          old
            ? { ...applyPollSummary(old, summary), myVoteOptionId: optionId }
            : old
      );
    } catch {
      // Leave state untouched if the vote failed (e.g. poll closed mid-flight).
    }
  };

  const handleClose = async () => {
    if (!message.poll_id || !poll || poll.isClosed) return;
    try {
      await groupyApi.closePoll(message.poll_id);
      queryClient.setQueryData<GroupyPollDetail>(
        groupyPollKey(message.poll_id),
        (old) => (old ? applyPollClosed(old) : old)
      );
    } catch {
      // Ignore close failures; state will reconcile via socket events.
    }
  };

  if (isLoading || !poll) {
    return <div className="text-xs text-muted-foreground py-1">Loading poll...</div>;
  }

  const maxVotes = Math.max(1, ...poll.options.map((o) => o.voteCount));

  return (
    <div className="min-w-[260px] max-w-full space-y-2">
      <p className="text-sm font-semibold">{poll.question}</p>

      <div className="space-y-1.5">
        {poll.options.map((option) => {
          const mine = option.id === poll.myVoteOptionId;
          const pct = Math.round((option.voteCount / maxVotes) * 100);
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => handleVote(option.id)}
              className={cn(
                "relative w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors overflow-hidden",
                mine
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-background hover:bg-muted/40",
                disabled && "cursor-not-allowed opacity-80"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 bg-primary/10",
                  mine ? "bg-primary/15" : ""
                )}
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className="font-medium">
                  {option.label}
                  {mine && <span className="ml-1.5 text-primary">•</span>}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {option.voteCount}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <p className="text-[11px] text-muted-foreground">
          {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
          {poll.isClosed ? " · Closed" : ""}
        </p>
        {isCreator && !poll.isClosed && (
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
          >
            Close poll
          </button>
        )}
      </div>
    </div>
  );
}

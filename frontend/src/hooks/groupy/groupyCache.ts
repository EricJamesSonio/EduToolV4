import type {
  GroupyMessage,
  GroupyPollDetail,
  GroupyReactionType,
  PollResultsSummary,
} from "@/types/groupy/groupy.types";
import type { InfiniteData } from "@tanstack/react-query";

export const groupyMessagesKey = (classId: string) => [
  "groupy-messages",
  classId,
] as const;

export const groupyPollKey = (pollId: string) => ["groupy-poll", pollId] as const;

export type GroupyPages = InfiniteData<{
  messages: GroupyMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}>;

function pageMessages(data: GroupyPages): GroupyMessage[] {
  return data.pages.flatMap((p) => p.messages);
}

// Prepend a message to the newest page (messages are stored newest-first).
export function prependMessage(data: GroupyPages, message: GroupyMessage): GroupyPages {
  const already = pageMessages(data).some((m) => m.id === message.id);
  if (already) return data;
  const pages = data.pages.map((p, i) =>
    i === 0 ? { ...p, messages: [message, ...p.messages] } : p
  );
  return { ...data, pages };
}

// Remove a message by id, dropping any page that becomes empty.
export function removeMessage(data: GroupyPages, messageId: string): GroupyPages {
  const pages = data.pages
    .map((p) => ({ ...p, messages: p.messages.filter((m) => m.id !== messageId) }))
    .filter((p) => p.messages.length > 0);
  return { ...data, pages };
}

function patchReaction(
  data: GroupyPages,
  messageId: string,
  accountId: string,
  reactionType: GroupyReactionType | null
): GroupyPages {
  const pages = data.pages.map((p) => ({
    ...p,
    messages: p.messages.map((m) => {
      if (m.id !== messageId) return m;
      const others = m.reactions.filter((r) => r.account_id !== accountId);
      const reactions = reactionType
        ? [
            ...others,
            {
              id: `${m.id}-${accountId}`,
              org_id: m.org_id,
              message_id: m.id,
              account_id: accountId,
              reaction_type: reactionType,
              created_at: new Date().toISOString(),
            },
          ]
        : others;
      return { ...m, reactions };
    }),
  }));
  return { ...data, pages };
}

export function upsertReaction(
  data: GroupyPages,
  messageId: string,
  accountId: string,
  reactionType: GroupyReactionType
): GroupyPages {
  return patchReaction(data, messageId, accountId, reactionType);
}

export function removeReaction(
  data: GroupyPages,
  messageId: string,
  accountId: string
): GroupyPages {
  return patchReaction(data, messageId, accountId, null);
}

// Update a poll's option vote counts + totalVotes from a results summary
// (e.g. a `groupy:poll:vote-updated` event). Keeps the current user's own
// highlighted choice intact, since the summary is counts-only.
export function applyPollSummary(
  detail: GroupyPollDetail,
  summary: PollResultsSummary
): GroupyPollDetail {
  return {
    ...detail,
    totalVotes: summary.totalVotes,
    options: detail.options.map((o) => {
      const match = summary.options.find((s) => s.id === o.id);
      return match ? { ...o, voteCount: match.votes } : o;
    }),
  };
}

export function applyPollClosed(detail: GroupyPollDetail): GroupyPollDetail {
  return { ...detail, is_closed: true, isClosed: true };
}
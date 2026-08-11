"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { groupyApi } from "@/api/shared/groupy.api";
import { useGroupyMessages } from "@/hooks/groupy/useGroupyMessages";
import { useGroupySocket } from "@/hooks/groupy/useGroupySocket";
import {
  groupyMessagesKey,
  prependMessage,
  removeMessage,
  removeReaction,
  upsertReaction,
  type GroupyPages,
} from "@/hooks/groupy/groupyCache";
import type { GroupyMessage, GroupyReactionType } from "@/types/groupy/groupy.types";
import { MessageList } from "./MessageList";
import { SendBox } from "./SendBox";
import { PollCreatorDialog } from "./PollCreatorDialog";
import { StartMeetingButton } from "./StartMeetingButton";

interface GroupyChatFeatureProps {
  classId: string;
  role: "educator" | "student";
  currentUserId: string;
}

export function GroupyChatFeature({
  classId,
  role,
  currentUserId,
}: GroupyChatFeatureProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const query = useGroupyMessages(classId);
  useGroupySocket({ classId });
  const [pollCreatorOpen, setPollCreatorOpen] = useState(false);

  const key = groupyMessagesKey(classId);
  const isEducator = role === "educator";

  // Pages are newest-first; reverse so the list renders oldest → newest (chat order).
  const messages = useMemo<GroupyMessage[]>(
    () => query.data?.pages.flatMap((p) => p.messages).slice().reverse() ?? [],
    [query.data]
  );

  const prepend = (message: GroupyMessage) => {
    queryClient.setQueryData(
      key,
      (old: GroupyPages | undefined) => (old ? prependMessage(old, message) : old)
    );
  };

  const handleSend = async (text: string) => {
    const message = await groupyApi.sendMessage(classId, { type: "text", body: text });
    prepend(message);
  };

  const handleSendGif = async (gifUrl: string) => {
    const message = await groupyApi.sendMessage(classId, { type: "gif", gifUrl });
    prepend(message);
  };

  const handleSendSticker = async (stickerId: string) => {
    const message = await groupyApi.sendMessage(classId, { type: "sticker", stickerId });
    prepend(message);
  };

  const handleDelete = async (messageId: string) => {
    await groupyApi.deleteMessage(messageId);
    queryClient.setQueryData(
      key,
      (old: GroupyPages | undefined) => (old ? removeMessage(old, messageId) : old)
    );
  };

  const handleReact = async (
    messageId: string,
    reactionType: GroupyReactionType
  ) => {
    await groupyApi.setReaction(messageId, reactionType);
    queryClient.setQueryData(
      key,
      (old: GroupyPages | undefined) =>
        old ? upsertReaction(old, messageId, currentUserId, reactionType) : old
    );
  };

  const handleRemoveReaction = async (messageId: string) => {
    await groupyApi.removeReaction(messageId);
    queryClient.setQueryData(
      key,
      (old: GroupyPages | undefined) =>
        old ? removeReaction(old, messageId, currentUserId) : old
    );
  };

  const handlePollCreated = (message: GroupyMessage) => {
    prepend(message);
    setPollCreatorOpen(false);
  };

  const handleMeetingStarted = () => {
    query.refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Class Chat</h2>
          <span className="text-[11px] text-muted-foreground capitalize">{role}</span>
        </div>
        {isEducator && (
          <StartMeetingButton classId={classId} onStarted={handleMeetingStarted} />
        )}
      </div>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        role={role}
        hasOlder={query.hasNextPage}
        loadingOlder={query.isFetchingNextPage}
        onLoadOlder={() =>
          query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()
        }
        onDelete={handleDelete}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
      />
      <SendBox
        onSend={handleSend}
        onSendGif={handleSendGif}
        onSendSticker={handleSendSticker}
        onOpenPollCreator={() => setPollCreatorOpen(true)}
        canCreatePoll={isEducator}
      />
      <PollCreatorDialog
        open={pollCreatorOpen}
        onOpenChange={setPollCreatorOpen}
        classId={classId}
        onCreated={handlePollCreated}
      />
    </div>
  );
}
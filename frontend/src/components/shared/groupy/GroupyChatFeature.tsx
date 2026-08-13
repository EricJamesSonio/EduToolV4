"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groupyApi } from "@/api/shared/groupy.api";
import { useGroupyMessages } from "@/hooks/groupy/useGroupyMessages";
import { useGroupySocket } from "@/hooks/groupy/useGroupySocket";
import { useGroupyMembers, groupyMembersKey } from "@/hooks/groupy/useGroupyMembers";
import {
  useGroupyActiveMeeting,
  groupyActiveMeetingKey,
} from "@/hooks/groupy/useGroupyActiveMeeting";
import {
  groupyMessagesKey,
  prependMessage,
  removeMessage,
  removeReaction,
  upsertReaction,
  type GroupyPages,
} from "@/hooks/groupy/groupyCache";
import type {
  GroupyMember,
  GroupyMembersResponse,
  GroupyMessage,
  GroupyReactionType,
} from "@/types/groupy/groupy.types";
import { MessageList } from "./MessageList";
import { SendBox } from "./SendBox";
import { PollCreatorDialog } from "./PollCreatorDialog";
import { StartMeetingDialog } from "./StartMeetingDialog";
import { ActiveMeetingBanner } from "./ActiveMeetingBanner";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useGroupyMessages(classId);
  const membersQuery = useGroupyMembers(classId);
  const activeMeetingQuery = useGroupyActiveMeeting(classId);
  useGroupySocket({ classId });
  const [pollCreatorOpen, setPollCreatorOpen] = useState(false);
  const [startMeetingOpen, setStartMeetingOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const lastReportedReadRef = useRef<string | null>(null);

  const key = groupyMessagesKey(classId);
  const isEducator = role === "educator";

  // Pages are newest-first; reverse so the list renders oldest → newest (chat order).
  const messages = useMemo<GroupyMessage[]>(
    () => query.data?.pages.flatMap((p) => p.messages).slice().reverse() ?? [],
    [query.data]
  );

  const newestId = messages[messages.length - 1]?.id ?? null;

  // Live groupy meeting for the class, if one exists right now.
  const activeMeeting = useMemo(() => {
    const data = activeMeetingQuery.data;
    return data?.meeting
      ? { meetingId: data.meeting.meetingId, title: data.meeting.title }
      : null;
  }, [activeMeetingQuery.data]);

  // True once the active-meeting status has been fetched at least once, so
  // meeting messages don't flash "ended" while the status is still unknown.
  const meetingStatusKnown = activeMeetingQuery.data !== undefined;

  // Members who have read the newest message — becomes the messenger-style
  // "seen by" avatar row at the bottom of the last message.
  const seenBy = useMemo<GroupyMember[]>(() => {
    const others = membersQuery.data?.members ?? [];
    if (!newestId) return [];
    return others.filter((m) => m.last_read_message_id === newestId);
  }, [membersQuery.data, newestId]);

  // Auto-report "read" when the newest message is visible at the bottom.
  useEffect(() => {
    if (!atBottom || !newestId) return;
    const me = membersQuery.data?.me;
    if (me && me.last_read_message_id === newestId) {
      lastReportedReadRef.current = newestId;
      return;
    }
    if (lastReportedReadRef.current === newestId) return;

    lastReportedReadRef.current = newestId;
    const membersKey = groupyMembersKey(classId);
    queryClient.setQueryData<GroupyMembersResponse>(membersKey, (old) =>
      old?.me ? { ...old, me: { ...old.me, last_read_message_id: newestId } } : old
    );
    groupyApi.reportRead(classId, newestId).catch(() => {});
  }, [atBottom, newestId, classId, membersQuery.data, queryClient]);

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

  const handleMeetingStarted = (meetingId: string) => {
    // Start a fresh active-meeting check and jump the educator into the room.
    queryClient.invalidateQueries({ queryKey: groupyActiveMeetingKey(classId) });
    const base = role === "educator" ? "/educator" : "/student";
    router.push(
      `${base}/classes/${classId}/meetings/${meetingId}/room?origin=groupy`
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Class Chat</h2>
          <span className="text-[11px] text-muted-foreground capitalize">{role}</span>
        </div>
        {isEducator && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setStartMeetingOpen(true)}
          >
            <Video className="h-4 w-4" />
            Start Meeting
          </Button>
        )}
      </div>
      <ActiveMeetingBanner
        classId={classId}
        role={role}
        activeMeeting={activeMeeting}
      />
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        role={role}
        seenBy={seenBy}
        activeMeetingId={activeMeeting?.meetingId ?? null}
        meetingStatusKnown={meetingStatusKnown}
        hasOlder={query.hasNextPage}
        loadingOlder={query.isFetchingNextPage}
        onLoadOlder={() =>
          query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()
        }
        onDelete={handleDelete}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        onAtBottomChange={setAtBottom}
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
      <StartMeetingDialog
        open={startMeetingOpen}
        onOpenChange={setStartMeetingOpen}
        classId={classId}
        onStarted={handleMeetingStarted}
      />
    </div>
  );
}
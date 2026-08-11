import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import type {
  GroupyMessage,
  GroupyPollDetail,
  GroupyReactionType,
  PollResultsSummary,
} from "@/types/groupy/groupy.types";
import {
  applyPollClosed,
  applyPollSummary,
  groupyMessagesKey,
  groupyPollKey,
  prependMessage,
  removeMessage,
  removeReaction,
  upsertReaction,
  type GroupyPages,
} from "./groupyCache";

interface UseGroupySocketProps {
  classId: string;
}

interface UseGroupySocketReturn {
  socket: Socket | null;
  connected: boolean;
}

export const useGroupySocket = ({
  classId,
}: UseGroupySocketProps): UseGroupySocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!classId || !token) return;

    let isActive = true;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/groupy`, {
      auth: { token },
      query: { classId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    const key = groupyMessagesKey(classId);

    const update = (fn: (data: GroupyPages) => GroupyPages) => {
      if (!isActive) return;
      queryClient.setQueryData<GroupyPages>(key, (old) => (old ? fn(old) : old));
    };

    socket.on("connect", () => {
      if (isActive) setConnected(true);
    });

    socket.on("disconnect", () => {
      if (isActive) setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Groupy socket connect error:", err.message);
    });

    socket.on("groupy:message:new", (message: GroupyMessage) => {
      update((old) => prependMessage(old, message));
    });

    socket.on(
      "groupy:message:deleted",
      (payload: { id: string }) => {
        update((old) => removeMessage(old, payload.id));
      }
    );

    socket.on(
      "groupy:reaction:updated",
      (payload: {
        messageId: string;
        accountId: string;
        reactionType: GroupyReactionType;
      }) => {
        update((old) =>
          upsertReaction(old, payload.messageId, payload.accountId, payload.reactionType)
        );
      }
    );

    socket.on(
      "groupy:reaction:removed",
      (payload: { messageId: string; accountId: string }) => {
        update((old) => removeReaction(old, payload.messageId, payload.accountId));
      }
    );

    const updatePoll = (
      pollId: string,
      fn: (detail: GroupyPollDetail) => GroupyPollDetail
    ) => {
      if (!isActive) return;
      queryClient.setQueryData<GroupyPollDetail>(
        groupyPollKey(pollId),
        (old) => (old ? fn(old) : old)
      );
    };

    socket.on(
      "groupy:poll:vote-updated",
      (payload: { pollId: string; resultsSummary: PollResultsSummary }) => {
        updatePoll(payload.pollId, (detail) =>
          applyPollSummary(detail, payload.resultsSummary)
        );
      }
    );

    socket.on(
      "groupy:poll:closed",
      (payload: { pollId: string }) => {
        updatePoll(payload.pollId, applyPollClosed);
      }
    );

    return () => {
      isActive = false;
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [classId, token, queryClient]);

  return {
    socket: socketRef.current,
    connected,
  };
};
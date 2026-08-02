"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import type { ChatMessage } from "@/types/meeting/socket.types";

interface UseChatOptions {
  chat: ChatMessage[];
  sendChat: (message: string) => void;
  currentUserId: string;
  currentUserName: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  send: (message: string) => void;
}

interface OptimisticMessage extends ChatMessage {
  _tempId: number;
}

let nextTempId = 1;

const OPTIMISTIC_TTL_MS = 3000;

export function useChat({
  chat,
  sendChat,
  currentUserId,
  currentUserName,
}: UseChatOptions): UseChatReturn {
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const messages = useMemo(() => {
    const serverCount = new Map<string, number>();
    for (const m of chat) {
      const key = `${m.senderId}|${m.message}`;
      serverCount.set(key, (serverCount.get(key) ?? 0) + 1);
    }

    const matched = new Map<string, number>();
    const filtered = optimistic.filter((opt) => {
      const key = `${opt.senderId}|${opt.message}`;
      const count = matched.get(key) ?? 0;
      const total = serverCount.get(key) ?? 0;
      if (count < total) {
        matched.set(key, count + 1);
        return false;
      }
      return true;
    });

    const merged = [...chat, ...filtered];
    merged.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return merged;
  }, [chat, optimistic]);

  const send = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      const tempId = nextTempId++;

      const opt: OptimisticMessage = {
        id: tempId.toString(),
        _tempId: tempId,
        senderId: currentUserId,
        senderName: currentUserName,
        message: trimmed,
        createdAt: new Date().toISOString(),
      };

      setOptimistic((prev) => [...prev, opt]);

      const timer = setTimeout(() => {
        setOptimistic((prev) => prev.filter((m) => m._tempId !== tempId));
        timersRef.current.delete(tempId);
      }, OPTIMISTIC_TTL_MS);

      timersRef.current.set(tempId, timer);

      sendChat(trimmed);
    },
    [currentUserId, currentUserName, sendChat]
  );

  return { messages, send };
}

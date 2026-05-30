import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

import type {
  MeetingParticipant,
  ChatMessage,
} from "@/types/meeting/socket.types";

interface UseMeetingSocketProps {
  meetingId: string;
  token: string;
}

// ── New: incoming reaction & hand-raise payloads ──────────────────────────────
export interface IncomingReaction {
  emoji: string;
  /** unique id so the overlay can deduplicate */
  id: string;
}

export interface IncomingHandRaise {
  userId: string;
  name: string;
}

interface UseMeetingSocketReturn {
  socket: Socket | null;
  connected: boolean;
  participants: MeetingParticipant[];
  chat: ChatMessage[];
  currentSlide: number;
  isPresenting: boolean;
  presentationId: string | null;
  /** Latest reaction received from ANY participant (including self) */
  latestReaction: IncomingReaction | null;
  /** Latest hand-raise event (fires when a participant raises their hand) */
  latestHandRaise: IncomingHandRaise | null;
  sendChat: (message: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendReaction: (emoji: string) => void;
  changeSlide: (slide: number) => void;
  startPresentation: (presentationId?: string) => void;
  stopPresentation: () => void;
}

export const useMeetingSocket = ({
  meetingId,
  token,
}: UseMeetingSocketProps): UseMeetingSocketReturn => {
  const socketRef = useRef<Socket | null>(null);

  const [connected,        setConnected]        = useState(false);
  const [participants,     setParticipants]      = useState<MeetingParticipant[]>([]);
  const [chat,             setChat]              = useState<ChatMessage[]>([]);
  const [currentSlide,     setCurrentSlide]      = useState(0);
  const [isPresenting,     setIsPresenting]      = useState(false);
  const [presentationId,   setPresentationId]    = useState<string | null>(null);
  const [latestReaction,   setLatestReaction]    = useState<IncomingReaction | null>(null);
  const [latestHandRaise,  setLatestHandRaise]   = useState<IncomingHandRaise | null>(null);

  // Track previous participants to detect hand-raise changes
  const prevParticipantsRef = useRef<MeetingParticipant[]>([]);

  useEffect(() => {
    if (!meetingId || !token) return;

    let isActive = true;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/meeting`, {
      auth: { token },
      query: { meetingId },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (isActive) setConnected(true);
    });

    socket.on("disconnect", () => {
      if (isActive) setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socket.on(
      "room:state",
      (data: {
        participants: MeetingParticipant[];
        chatHistory: ChatMessage[];
        currentSlide: number;
        isPresenting: boolean;
        presentationId?: string | null;
      }) => {
        if (!isActive) return;
        setParticipants(data.participants || []);
        prevParticipantsRef.current = data.participants || [];
        setChat(data.chatHistory || []);
        setCurrentSlide(data.currentSlide ?? 0);
        setIsPresenting(data.isPresenting ?? false);
        setPresentationId(data.presentationId ?? null);
      }
    );

    socket.on(
      "room:participant_joined",
      (data: { participants: MeetingParticipant[] }) => {
        if (!isActive) return;
        setParticipants(data.participants || []);
        prevParticipantsRef.current = data.participants || [];
      }
    );

    socket.on(
      "room:participant_left",
      (data: { participants: MeetingParticipant[] }) => {
        if (!isActive) return;
        setParticipants(data.participants || []);
        prevParticipantsRef.current = data.participants || [];
      }
    );

    socket.on("chat:message", (msg: ChatMessage) => {
      if (!isActive) return;
      setChat((prev) => [...prev, msg]);
    });

    // ── Hand raise: detect newly raised hands by diffing participants ─────────
    socket.on(
      "hand:update",
      (data: { participants: MeetingParticipant[] }) => {
        if (!isActive) return;

        const incoming = data.participants || [];
        const prev     = prevParticipantsRef.current;

        // Find someone who just raised their hand (wasn't raised before, now is)
        const newRaise = incoming.find((p) => {
          if (!p.handRaised) return false;
          const old = prev.find((o) => o.userId === p.userId);
          return !old?.handRaised;
        });

        if (newRaise) {
          setLatestHandRaise({ userId: newRaise.userId, name: newRaise.name });
        }

        prevParticipantsRef.current = incoming;
        setParticipants(incoming);
      }
    );

    // ── Incoming reaction from server broadcast ───────────────────────────────
    // The server should broadcast a "reaction:received" event to all room members.
    // Payload: { emoji: string, senderId: string }
    socket.on(
      "reaction:received",
      (data: { emoji: string; senderId: string }) => {
        if (!isActive) return;
        setLatestReaction({
          emoji: data.emoji,
          id:    `${data.senderId}-${Date.now()}-${Math.random()}`,
        });
      }
    );

    // Fallback: some backends echo the sender's own event as "reaction:send"
    socket.on(
      "reaction:send",
      (data: { emoji: string; senderId?: string }) => {
        if (!isActive) return;
        setLatestReaction({
          emoji: data.emoji,
          id:    `echo-${Date.now()}-${Math.random()}`,
        });
      }
    );

    socket.on("lesson:slide_sync", (data: { slide: number }) => {
      if (!isActive) return;
      setCurrentSlide(data.slide);
    });

    socket.on(
      "lesson:presentation_started",
      (data: { currentSlide: number; presentationId?: string }) => {
        if (!isActive) return;
        setIsPresenting(true);
        setCurrentSlide(data.currentSlide);
        if (data.presentationId) setPresentationId(data.presentationId);
      }
    );

    socket.on("lesson:presentation_stopped", () => {
      if (!isActive) return;
      setIsPresenting(false);
      setPresentationId(null);
    });

    return () => {
      isActive = false;
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [meetingId, token]);

  const sendChat = useCallback((message: string): void => {
    socketRef.current?.emit("chat:send", { message });
  }, []);

  const raiseHand = useCallback((): void => {
    socketRef.current?.emit("hand:raise");
  }, []);

  const lowerHand = useCallback((): void => {
    socketRef.current?.emit("hand:lower");
  }, []);

  const sendReaction = useCallback((emoji: string): void => {
    socketRef.current?.emit("reaction:send", { emoji });
    // Optimistically show the local user's own reaction immediately
    setLatestReaction({
      emoji,
      id: `local-${Date.now()}-${Math.random()}`,
    });
  }, []);

  const changeSlide = useCallback((slide: number): void => {
    socketRef.current?.emit("lesson:slide_change", { slide });
  }, []);

  const startPresentation = useCallback((presentationId?: string): void => {
    socketRef.current?.emit("lesson:presentation_start", { presentationId });
  }, []);

  const stopPresentation = useCallback((): void => {
    socketRef.current?.emit("lesson:presentation_stop");
  }, []);

  return {
    socket: socketRef.current,
    connected,
    participants,
    chat,
    currentSlide,
    isPresenting,
    presentationId,
    latestReaction,
    latestHandRaise,
    sendChat,
    raiseHand,
    lowerHand,
    sendReaction,
    changeSlide,
    startPresentation,
    stopPresentation,
  };
};
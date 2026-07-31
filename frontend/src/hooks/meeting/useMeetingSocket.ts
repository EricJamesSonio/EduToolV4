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
  senderName: string;
}

export interface IncomingHandRaise {
  userId: string;
  name: string;
  /** unique timestamp-based id so the overlay can skip stale events on re-mount */
  id: string;
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
  /** Clear the last received reaction (used on meeting re-entry) */
  clearLatestReaction: () => void;
  /** Clear the last hand-raise event (used on meeting re-entry) */
  clearLatestHandRaise: () => void;
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
  // Timer for self-echo fallback — cancelled if server echoes back first
  const selfEchoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!meetingId || !token) return;

let isActive = true;

// Reset ephemeral overlay state for the new session.
// Without this, the last reaction/hand-raise from the PREVIOUS session
// lingers in state and re-triggers ReactionOverlay on rejoin.
setLatestReaction(null);
setLatestHandRaise(null);
prevParticipantsRef.current = [];

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
          setLatestHandRaise({
            userId: newRaise.userId,
            name:   newRaise.name,
            id:     `${newRaise.userId}-${Date.now()}`,
          });
        }

        prevParticipantsRef.current = incoming;
        setParticipants(incoming);
      }
    );

    // ── Incoming reaction from server broadcast ───────────────────────────────
    // The server should broadcast a "reaction:received" event to all room members.
    // Payload: { emoji: string, senderId: string, senderName?: string }
    socket.on(
      "reaction:received",
      (data: { emoji: string; userId: string; name: string }) => {
        if (!isActive) return;
        if (selfEchoTimerRef.current) {
          clearTimeout(selfEchoTimerRef.current);
          selfEchoTimerRef.current = null;
        }
        setLatestReaction({
          emoji:      data.emoji,
          id:         `${data.userId}-${Date.now()}-${Math.random()}`,
          senderName: data.name,
        });
      }
    );

    // Fallback: some backends echo the sender's own event as "reaction:send"
    socket.on(
      "reaction:send",
      (data: { emoji: string; userId?: string; name?: string }) => {
        if (!isActive) return;
        if (selfEchoTimerRef.current) {
          clearTimeout(selfEchoTimerRef.current);
          selfEchoTimerRef.current = null;
        }
        setLatestReaction({
          emoji:      data.emoji,
          id:         `echo-${Date.now()}-${Math.random()}`,
          senderName: data.name ?? "Someone",
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
  if (selfEchoTimerRef.current) {       // ← ADD: cancel any pending self-echo
    clearTimeout(selfEchoTimerRef.current);
    selfEchoTimerRef.current = null;
  }
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
    // Cancel any pending self-echo timer from a previous rapid call
    if (selfEchoTimerRef.current) {
      clearTimeout(selfEchoTimerRef.current);
      selfEchoTimerRef.current = null;
    }

    const selfId = `self-${Date.now()}-${Math.random()}`;
    socketRef.current?.emit("reaction:send", { emoji });

    // If the server echoes back to the sender, the socket listener will fire
    // and seenEmojiIds in the overlay will block this self-id (different id anyway).
    // We set a short grace period — if no echo arrives within 400ms we show it
    // ourselves so the sender always sees their own reaction.
    const timer = setTimeout(() => {
      setLatestReaction({
        emoji,
        id:         selfId,
        senderName: "You",
      });
    }, 400);

    // Store timer so the socket listener can cancel it on echo arrival
    selfEchoTimerRef.current = timer;
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

  // ── Ephemeral state reset ──────────────────────────────────────────────────
  // Used when re-entering an already-running meeting so stale reactions /
  // hand-raises from the previous room session never leak into the overlay.
  const clearLatestReaction = useCallback(() => {
    if (selfEchoTimerRef.current) {
      clearTimeout(selfEchoTimerRef.current);
      selfEchoTimerRef.current = null;
    }
    setLatestReaction(null);
  }, []);

  const clearLatestHandRaise = useCallback(() => {
    setLatestHandRaise(null);
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
    clearLatestReaction,
    clearLatestHandRaise,
  };
};
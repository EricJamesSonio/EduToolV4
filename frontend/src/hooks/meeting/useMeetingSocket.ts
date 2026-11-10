import { useEffect, useRef, useState, useCallback } from "react";
// Type-only: the runtime client is imported lazily so portal routes that never
// open a meeting do not download/ship the socket.io bundle.
import type { Socket } from "socket.io-client";

import { refreshAccessToken } from "@/api/client";
import { useAuthStore } from "@/store/auth.store";
import type {
  MeetingParticipant,
  ChatMessage,
} from "@/types/meeting/socket.types";

interface UseMeetingSocketProps {
  meetingId: string;
  token: string;
}

export interface IncomingReaction {
  emoji: string;
  /** shared id (stamped by the server) so every client places it identically */
  id: string;
  senderName: string;
  /** client clock time the event arrived, used to skip stale events on re-mount */
  receivedAt?: number;
}

export interface IncomingHandRaise {
  userId: string;
  name: string;
  /** unique timestamp-based id so the overlay can skip stale events on re-mount */
  id: string;
}

const MAX_RECENT_REACTIONS = 20;
const MAX_QUEUED_EMITS = 8;
const MAX_TOKEN_RETRIES = 3;

interface QueuedEmit {
  event: string;
  payload?: unknown;
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
  /** Recent reactions, so several arriving at once are never dropped */
  recentReactions: IncomingReaction[];
  /** Latest hand-raise event (fires when a participant raises their hand) */
  latestHandRaise: IncomingHandRaise | null;
  /** True once the host ends the meeting — all connected clients must exit. */
  meetingEnded: boolean;
  /** Reset the ended flag (used when leaving / starting a new meeting). */
  clearMeetingEnded: () => void;
  sendChat: (message: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendReaction: (emoji: string) => void;
  changeSlide: (slide: number) => void;
  startPresentation: (presentationId?: string) => void;
  stopPresentation: () => void;
  /** Clear received reactions (used on meeting re-entry) */
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
  const [recentReactions,  setRecentReactions]   = useState<IncomingReaction[]>([]);
  const [latestHandRaise,  setLatestHandRaise]   = useState<IncomingHandRaise | null>(null);
  const [meetingEnded,     setMeetingEnded]      = useState(false);

  // Track previous participants to detect hand-raise changes
  const prevParticipantsRef = useRef<MeetingParticipant[]>([]);
  // The server tells us who we are, so our own events can read "You".
  const selfUserIdRef = useRef<string | null>(null);
  // True only once the server has registered us in the room (room:state).
  const readyRef = useRef(false);
  // Emits made before the room was ready; flushed as soon as it is.
  const pendingRef = useRef<QueuedEmit[]>([]);
  // Last reason the server gave before it dropped us.
  const lastServerErrorRef = useRef<string | null>(null);
  const tokenRetriesRef = useRef(0);

  useEffect(() => {
    if (!meetingId || !token) return;

    let isActive = true;
    let socket: Socket | null = null;

    // Reset ephemeral overlay state for the new session.
    // Without this, the last reaction/hand-raise from the PREVIOUS session
    // lingers in state and re-triggers ReactionOverlay on rejoin.
    setLatestReaction(null);
    setRecentReactions([]);
    setLatestHandRaise(null);
    setMeetingEnded(false);
    prevParticipantsRef.current = [];
    selfUserIdRef.current = null;
    readyRef.current = false;
    pendingRef.current = [];
    lastServerErrorRef.current = null;
    tokenRetriesRef.current = 0;

    const flushPending = (): void => {
      const queued = pendingRef.current;
      pendingRef.current = [];
      for (const item of queued) {
        if (item.payload === undefined) socket?.emit(item.event);
        else socket?.emit(item.event, item.payload);
      }
    };

    void (async () => {
      const { io } = await import("socket.io-client");

      if (!isActive) return;

      socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/meeting`, {
        // Evaluated on every connect attempt, so a reconnect after the access
        // token was refreshed always carries the fresh one.
        auth: (cb) => {
          cb({ token: useAuthStore.getState().accessToken || token });
        },
        query: { meetingId },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        // Not "connected" for the UI yet: the server registers us in the room
        // a moment later and signals it with room:state.
        readyRef.current = false;
      });

      socket.on("disconnect", (reason: string) => {
        readyRef.current = false;
        if (isActive) setConnected(false);

        // The server dropped us on purpose (for example an expired token).
        // socket.io does not reconnect after that, so do it here once the
        // access token has been refreshed.
        if (!isActive || reason !== "io server disconnect") return;
        const serverError = lastServerErrorRef.current;
        if (serverError !== "Invalid token" && serverError !== "Missing token") return;
        if (tokenRetriesRef.current >= MAX_TOKEN_RETRIES) return;

        tokenRetriesRef.current += 1;
        lastServerErrorRef.current = null;
        void refreshAccessToken()
          .then(() => {
            if (isActive) socket?.connect();
          })
          .catch(() => undefined);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connect error:", err.message);
      });

      socket.on("error", (err: { message?: string }) => {
        lastServerErrorRef.current = err?.message ?? null;
        console.error("Meeting socket error:", err?.message ?? err);
      });

      socket.on(
        "room:state",
        (data: {
          participants: MeetingParticipant[];
          chatHistory: ChatMessage[];
          currentSlide: number;
          isPresenting: boolean;
          presentationId?: string | null;
          selfUserId?: string;
        }) => {
          if (!isActive) return;
          if (data.selfUserId) selfUserIdRef.current = data.selfUserId;
          tokenRetriesRef.current = 0;
          setParticipants(data.participants || []);
          prevParticipantsRef.current = data.participants || [];
          setChat(data.chatHistory || []);
          setCurrentSlide(data.currentSlide ?? 0);
          setIsPresenting(data.isPresenting ?? false);
          setPresentationId(data.presentationId ?? null);

          readyRef.current = true;
          setConnected(true);
          flushPending();
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

      // Hand raise: the server now sends this to everyone including the
      // sender. Detect newly raised hands by diffing participants.
      socket.on(
        "hand:update",
        (data: { participants: MeetingParticipant[] }) => {
          if (!isActive) return;

          const incoming = data.participants || [];
          const prev     = prevParticipantsRef.current;

          const newRaise = incoming.find((p) => {
            if (!p.handRaised) return false;
            const old = prev.find((o) => o.userId === p.userId);
            return !old?.handRaised;
          });

          if (newRaise) {
            const isSelf =
              !!selfUserIdRef.current && newRaise.userId === selfUserIdRef.current;
            setLatestHandRaise({
              userId: newRaise.userId,
              name:   isSelf ? "You" : newRaise.name,
              id:     `${newRaise.userId}-${Date.now()}`,
            });
          }

          prevParticipantsRef.current = incoming;
          setParticipants(incoming);
        }
      );

      // The server stamps every reaction with one id and sends it to everyone
      // including the sender, so all clients show it the same way.
      socket.on(
        "reaction:received",
        (data: { id?: string; emoji: string; userId: string; name: string }) => {
          if (!isActive) return;

          const isSelf =
            !!selfUserIdRef.current && data.userId === selfUserIdRef.current;

          const entry: IncomingReaction = {
            emoji:      data.emoji,
            id:         data.id ?? `${data.userId}-${Date.now()}-${Math.random()}`,
            senderName: isSelf ? "You" : data.name,
            receivedAt: Date.now(),
          };

          setLatestReaction(entry);
          setRecentReactions((prev) =>
            [...prev, entry].slice(-MAX_RECENT_REACTIONS),
          );
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

      // The host ended the meeting — force everyone out of the room immediately.
      socket.on("meeting:ended", () => {
        if (!isActive) return;
        setMeetingEnded(true);
      });
    })();

    return () => {
      isActive = false;
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
      readyRef.current = false;
      pendingRef.current = [];
      setConnected(false);
    };
  }, [meetingId, token]);

  // Emits right away when the room is ready, otherwise holds the event until
  // the server has registered us so it is never silently dropped.
  const emitSafe = useCallback((event: string, payload?: unknown): void => {
    const current = socketRef.current;
    if (current && current.connected && readyRef.current) {
      if (payload === undefined) current.emit(event);
      else current.emit(event, payload);
      return;
    }
    pendingRef.current.push({ event, payload });
    if (pendingRef.current.length > MAX_QUEUED_EMITS) pendingRef.current.shift();
  }, []);

  const sendChat = useCallback((message: string): void => {
    emitSafe("chat:send", { message });
  }, [emitSafe]);

  const raiseHand = useCallback((): void => {
    emitSafe("hand:raise");
  }, [emitSafe]);

  const lowerHand = useCallback((): void => {
    emitSafe("hand:lower");
  }, [emitSafe]);

  const sendReaction = useCallback((emoji: string): void => {
    // The server echoes the reaction back to everyone, including us.
    emitSafe("reaction:send", { emoji });
  }, [emitSafe]);

  const changeSlide = useCallback((slide: number): void => {
    setCurrentSlide(slide); // optimistic: server doesn't echo to sender
    emitSafe("lesson:slide_change", { slide });
  }, [emitSafe]);

  const startPresentation = useCallback((presentationId?: string): void => {
    setIsPresenting(true); // optimistic: server doesn't echo to sender
    if (presentationId) setPresentationId(presentationId);
    emitSafe("lesson:presentation_start", { presentationId });
  }, [emitSafe]);

  const stopPresentation = useCallback((): void => {
    setIsPresenting(false);
    setPresentationId(null);
    emitSafe("lesson:presentation_stop");
  }, [emitSafe]);

  const clearLatestReaction = useCallback(() => {
    setLatestReaction(null);
    setRecentReactions([]);
  }, []);

  const clearLatestHandRaise = useCallback(() => {
    setLatestHandRaise(null);
  }, []);

  const clearMeetingEnded = useCallback(() => {
    setMeetingEnded(false);
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
    recentReactions,
    latestHandRaise,
    meetingEnded,
    clearMeetingEnded,
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
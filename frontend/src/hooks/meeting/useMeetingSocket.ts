import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseMeetingSocketProps {
  meetingId: string;
  token: string; // JWT
}

export const useMeetingSocket = ({
  meetingId,
  token,
}: UseMeetingSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [chat, setChat] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  // ==============================
  // Connect
  // ==============================
  useEffect(() => {
    if (!meetingId || !token) return;

    const socket = io(
      `${process.env.NEXT_PUBLIC_WS_URL}/meeting`,
      {
        auth: { token },
        query: { meetingId },
        transports: ["websocket"],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // ==============================
    // Initial state
    // ==============================
    socket.on("room:state", (data) => {
      setParticipants(data.participants || []);
      setChat(data.chatHistory || []);
      setCurrentSlide(data.currentSlide ?? 0);
      setIsPresenting(data.isPresenting ?? false);
    });

    // ==============================
    // Participants
    // ==============================
    socket.on("room:participant_joined", (data) => {
      setParticipants(data.participants);
    });

    socket.on("room:participant_left", (data) => {
      setParticipants(data.participants);
    });

    // ==============================
    // Chat
    // ==============================
    socket.on("chat:message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    // ==============================
    // Hand raise
    // ==============================
    socket.on("hand:update", (data) => {
      setParticipants(data.participants);
    });

    // ==============================
    // Slides
    // ==============================
    socket.on("lesson:slide_sync", (data) => {
      setCurrentSlide(data.slide);
    });

    socket.on("lesson:presentation_started", (data) => {
      setIsPresenting(true);
      setCurrentSlide(data.currentSlide);
    });

    socket.on("lesson:presentation_stopped", () => {
      setIsPresenting(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [meetingId, token]);

  // ==============================
  // Emit helpers
  // ==============================

  const sendChat = useCallback((message: string) => {
    socketRef.current?.emit("chat:send", { message });
  }, []);

  const raiseHand = useCallback(() => {
    socketRef.current?.emit("hand:raise");
  }, []);

  const lowerHand = useCallback(() => {
    socketRef.current?.emit("hand:lower");
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    socketRef.current?.emit("reaction:send", { emoji });
  }, []);

  const changeSlide = useCallback((slide: number) => {
    socketRef.current?.emit("lesson:slide_change", { slide });
  }, []);

  const startPresentation = useCallback(() => {
    socketRef.current?.emit("lesson:presentation_start");
  }, []);

  const stopPresentation = useCallback(() => {
    socketRef.current?.emit("lesson:presentation_stop");
  }, []);

  return {
    socket: socketRef.current,
    connected,

    participants,
    chat,
    currentSlide,
    isPresenting,

    sendChat,
    raiseHand,
    lowerHand,
    sendReaction,
    changeSlide,
    startPresentation,
    stopPresentation,
  };
};
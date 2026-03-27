import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { MeetingParticipant, ChatMessage } from "@/types/meeting/socket.types";

interface UseMeetingSocketProps {
  meetingId: string;
  token: string;
}

interface UseMeetingSocketReturn {
  socket: Socket | null;
  connected: boolean;
  participants: MeetingParticipant[];
  chat: ChatMessage[];
  currentSlide: number;
  isPresenting: boolean;
  sendChat: (message: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendReaction: (emoji: string) => void;
  changeSlide: (slide: number) => void;
  startPresentation: () => void;
  stopPresentation: () => void;
}

export const useMeetingSocket = ({
  meetingId,
  token,
}: UseMeetingSocketProps): UseMeetingSocketReturn => {
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    if (!meetingId || !token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/meeting`, {
      auth: { token },
      query: { meetingId },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:state", (data: { participants: MeetingParticipant[]; chatHistory: ChatMessage[]; currentSlide: number; isPresenting: boolean }) => {
      setParticipants(data.participants || []);
      setChat(data.chatHistory || []);
      setCurrentSlide(data.currentSlide ?? 0);
      setIsPresenting(data.isPresenting ?? false);
    });

    socket.on("room:participant_joined", (data: { participants: MeetingParticipant[] }) => {
      setParticipants(data.participants);
    });

    socket.on("room:participant_left", (data: { participants: MeetingParticipant[] }) => {
      setParticipants(data.participants);
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      setChat((prev) => [...prev, msg]);
    });

    socket.on("hand:update", (data: { participants: MeetingParticipant[] }) => {
      setParticipants(data.participants);
    });

    socket.on("lesson:slide_sync", (data: { slide: number }) => {
      setCurrentSlide(data.slide);
    });

    socket.on("lesson:presentation_started", (data: { currentSlide: number }) => {
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
  }, []);

  const changeSlide = useCallback((slide: number): void => {
    socketRef.current?.emit("lesson:slide_change", { slide });
  }, []);

  const startPresentation = useCallback((): void => {
    socketRef.current?.emit("lesson:presentation_start");
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
    sendChat,
    raiseHand,
    lowerHand,
    sendReaction,
    changeSlide,
    startPresentation,
    stopPresentation,
  };
};
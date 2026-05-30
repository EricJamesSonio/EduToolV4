"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useAgoraRTC } from "@/hooks/meeting/useAgoraRTC";
import { useMeetingSocket } from "@/hooks/meeting/useMeetingSocket";
import type {
  ILocalAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import type {
  MeetingParticipant,
  ChatMessage,
} from "@/types/meeting/socket.types";
// ── NEW ──────────────────────────────────────────────────────────────────────
import type { IncomingReaction, IncomingHandRaise } from "@/hooks/meeting/useMeetingSocket";

interface MeetingTokenData {
  token: string;
  channel: string;
  appId: string;
  uid: number;
}

interface MeetingContextValue {
  isInMeeting: boolean;
  isMinimized: boolean;
  meetingId: string;
  classId: string;
  role: "educator" | "student";

  joined: boolean;
  localAudio: ILocalAudioTrack | null;
  localVideo: ILocalVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];

  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  shareScreen: () => Promise<void>;

  connected: boolean;
  participants: MeetingParticipant[];
  chat: ChatMessage[];
  currentSlide: number;
  isPresenting: boolean;
  presentationId: string | null;

  // ── NEW: overlay data ─────────────────────────────────────────────────────
  latestReaction: IncomingReaction | null;
  latestHandRaise: IncomingHandRaise | null;

  sendChat: (message: string) => void;
  raiseHand: () => void;
  lowerHand: () => void;
  sendReaction: (emoji: string) => void;

  changeSlide: (slide: number) => void;
  startPresentation: (presentationId?: string) => void;
  stopPresentation: () => void;

  joinMeeting: (params: {
    classId: string;
    meetingId: string;
    role: "educator" | "student";
    tokenData: MeetingTokenData;
    authToken: string;
  }) => void;

  leaveMeeting: () => void;
  minimize: () => void;
  maximize: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function useMeeting(): MeetingContextValue {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeeting must be used within MeetingProvider");
  return ctx;
}

export function MeetingProvider({ children }: { children: React.ReactNode }) {
  const [meetingParams, setMeetingParams] = useState<{
    classId: string;
    meetingId: string;
    role: "educator" | "student";
    tokenData: MeetingTokenData;
    authToken: string;
  } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [leaving,     setLeaving]     = useState(false);

  const agoraProps = meetingParams?.tokenData ?? {
    appId: "", channel: "", token: "", uid: 0,
  };

  const socketProps = {
    meetingId: meetingParams?.meetingId ?? "",
    token:     meetingParams?.authToken ?? "",
  };

  const {
    joined, localAudio, localVideo, remoteUsers, toggleMic, toggleCamera, shareScreen,
  } = useAgoraRTC(agoraProps);

  const {
    connected, participants, chat, currentSlide, isPresenting, presentationId,
    sendChat, raiseHand, lowerHand, sendReaction,
    changeSlide, startPresentation, stopPresentation,
    // ── NEW ──
    latestReaction,
    latestHandRaise,
  } = useMeetingSocket(socketProps);

  const joinMeeting = useCallback(
    (params: {
      classId: string;
      meetingId: string;
      role: "educator" | "student";
      tokenData: MeetingTokenData;
      authToken: string;
    }) => {
      setMeetingParams(params);
      setIsMinimized(false);
      setLeaving(false);
    },
    []
  );

  const leaveMeeting = useCallback(() => {
    setLeaving(true);
    setIsMinimized(false);
    setMeetingParams(null);
  }, []);

  const minimize = useCallback(() => setIsMinimized(true),  []);
  const maximize = useCallback(() => setIsMinimized(false), []);

  const value: MeetingContextValue = {
    isInMeeting: !!meetingParams && !leaving,
    isMinimized,
    meetingId: meetingParams?.meetingId ?? "",
    classId:   meetingParams?.classId   ?? "",
    role:      meetingParams?.role      ?? "student",

    joined, localAudio, localVideo, remoteUsers,
    toggleMic, toggleCamera, shareScreen,

    connected, participants, chat, currentSlide, isPresenting, presentationId,

    // ── NEW ──
    latestReaction,
    latestHandRaise,

    sendChat, raiseHand, lowerHand, sendReaction,
    changeSlide, startPresentation, stopPresentation,

    joinMeeting, leaveMeeting, minimize, maximize,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}
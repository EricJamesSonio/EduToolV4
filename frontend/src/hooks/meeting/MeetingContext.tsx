"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useAgoraRTC } from "@/hooks/meeting/useAgoraRTC";
import { useMeetingSocket } from "@/hooks/meeting/useMeetingSocket";
import type { ILocalAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import type { MeetingParticipant, ChatMessage } from "@/types/meeting/socket.types";

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

  joined: boolean;
  localAudio: ILocalAudioTrack | null;
  localVideo: ILocalVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  toggleMic: () => Promise<void>;
  toggleCamera: () => Promise<void>;

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

  joinMeeting: (params: { classId: string; meetingId: string; tokenData: MeetingTokenData; authToken: string }) => void;
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
    tokenData: MeetingTokenData;
    authToken: string;
  } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const agoraProps = meetingParams?.tokenData ?? { appId: "", channel: "", token: "", uid: 0 };
  const socketProps = { meetingId: meetingParams?.meetingId ?? "", token: meetingParams?.authToken ?? "" };

  const {
    joined, localAudio, localVideo, remoteUsers,
    toggleMic, toggleCamera,
  } = useAgoraRTC(agoraProps);

  const {
    connected, participants, chat, currentSlide, isPresenting,
    sendChat, raiseHand, lowerHand, sendReaction,
    changeSlide, startPresentation, stopPresentation,
  } = useMeetingSocket(socketProps);

  const joinMeeting = useCallback((params: {
    classId: string;
    meetingId: string;
    tokenData: MeetingTokenData;
    authToken: string;
  }) => {
    setMeetingParams(params);
    setIsMinimized(false);
    setLeaving(false);
  }, []);

  const leaveMeeting = useCallback(() => {
    setLeaving(true);
    setIsMinimized(false);
    setMeetingParams(null);
  }, []);

  const minimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const value: MeetingContextValue = {
    isInMeeting: !!meetingParams && !leaving,
    isMinimized,
    meetingId: meetingParams?.meetingId ?? "",
    classId: meetingParams?.classId ?? "",

    joined,
    localAudio,
    localVideo,
    remoteUsers,
    toggleMic,
    toggleCamera,

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

    joinMeeting,
    leaveMeeting,
    minimize,
    maximize,
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

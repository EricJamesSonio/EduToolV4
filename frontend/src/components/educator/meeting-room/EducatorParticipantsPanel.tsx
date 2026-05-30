// src/components/educator/meeting-room/ParticipantsPanel.tsx
"use client";

import { ParticipantsPanel as BaseParticipantsPanel } from "@/components/meeting/ParticipantsPanel";
import type { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";

interface Participant {
  userId: string;
  name: string;
  role: string;
  handRaised: boolean;
}

interface ParticipantsPanelProps {
  participants: Participant[];
  remoteUsers: IAgoraRTCRemoteUser[];
  currentUserId: string;
  currentUserName: string;
  localVideo?: { play: (id: string) => void } | null;
}

export function ParticipantsPanel(props: ParticipantsPanelProps) {
  return <BaseParticipantsPanel {...props} role="educator" />;
}
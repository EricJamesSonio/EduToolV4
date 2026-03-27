export interface MeetingParticipant {
  userId: string;
  name: string;
  role: "educator" | "student";
  handRaised: boolean;
}

export interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  sentAt: string;
}
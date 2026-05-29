export interface MeetingParticipant {
  userId: string;
  name: string;
  role: "educator" | "student";
  handRaised: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}
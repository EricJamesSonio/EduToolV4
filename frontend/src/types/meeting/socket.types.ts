export interface MeetingParticipant {
  userId: string;
  name: string;
  role: "educator" | "student" | "admin";
  handRaised: boolean;
}

/** An admin who chose to show the room that they are watching. */
export interface MeetingWatcher {
  userId: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}
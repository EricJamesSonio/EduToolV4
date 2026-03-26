import { MeetingStatus } from "@/types/educator/meeting.types";

export interface StudentMeeting {
  id: string;
  classId: string;
  classTitle: string;
  title: string;
  description: string | null;
  startTime: string;
  status: MeetingStatus;
  isInvited: boolean;
  joinRequestStatus: "none" | "pending" | "accepted" | "declined";
  agoraChannel: string | null;
}
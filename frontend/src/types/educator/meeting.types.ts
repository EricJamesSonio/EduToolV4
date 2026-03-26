export type MeetingStatus = "upcoming" | "live" | "ended";

export interface MeetingInvite {
  studentId: string;
  studentName: string;
  studentCode: string;
}

export interface JoinRequest {
  id: string;
  meetingId: string;
  studentId: string;
  studentName: string;
  requestedAt: string;
  status: "pending" | "accepted" | "declined";
}

export interface Meeting {
  id: string;
  classId: string;
  classTitle: string;
  educatorId: string;
  educatorName: string;
  title: string;
  description: string | null;
  startTime: string;
  status: MeetingStatus;
  invites: MeetingInvite[];
  joinRequests: JoinRequest[];
  agoraChannel: string | null;
  createdAt: string;
  updatedAt: string;
}
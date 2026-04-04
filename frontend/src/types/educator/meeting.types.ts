// Extended Meeting types matching actual backend response shape

export type MeetingStatus = "scheduled" | "live" | "ended";

export interface MeetingInvite {
  id:        string;
  studentId: string;
}

export interface MeetingJoinRequest {
  id:        string;
  studentId: string;
  status:    "pending" | "accepted" | "declined";
}

export interface Meeting {
  id:           string;
  title:        string;
  description?: string;
  startTime:    string;   // ISO string
  status:       MeetingStatus;
  invites:      MeetingInvite[];
  joinRequests: MeetingJoinRequest[];
}

export interface MeetingToken {
  token:    string;
  channel:  string;
  appId:    string;
  uid:      number;
  warning?: string;
}

export interface CreateMeetingDto {
  title:              string;
  description?:       string;
  startTime:          string;
  invitedStudentIds?: string[];  // empty = all enrolled students
}

export interface UpdateMeetingDto {
  title?:              string;
  description?:        string;
  startTime?:          string;
  invitedStudentIds?:  string[];
}

export interface EnrolledStudent {
  id:       string;
  fullName: string;
  email:    string;
}
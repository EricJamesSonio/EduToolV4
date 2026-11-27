export interface LiveMeetingParticipant {
  userId: string;
  name: string;
  role: string;
  handRaised: boolean;
  uid: number;
}

export interface LiveMeeting {
  id: string;
  title: string;
  description: string | null;
  classId: string;
  subjectName: string;
  subjectCode: string | null;
  educatorId: string;
  educatorName: string;
  startTime: string;
  isEphemeral: boolean;
  participantCount: number;
  participants: LiveMeetingParticipant[];
}

export interface LiveMeetingToken {
  token: string;
  channel: string;
  appId: string;
  uid: number;
  classId?: string;
  warning?: string;
}
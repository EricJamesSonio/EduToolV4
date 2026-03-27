import { useMutation, useQuery } from "@tanstack/react-query";
import { studentMeetingApi } from "@/api/student/meeting.api";

export const useStudentMeetings = (classId: string) => {
  return useQuery({
    queryKey: ["student", "meetings", classId],
    queryFn: () => studentMeetingApi.getAll(classId),
    enabled: !!classId,
  });
};

export const useStudentMeeting = (
  classId: string,
  meetingId: string
) => {
  return useQuery({
    queryKey: ["student", "meeting", classId, meetingId],
    queryFn: () =>
      studentMeetingApi.getOne(classId, meetingId),
    enabled: !!classId && !!meetingId,
  });
};

export const useRequestJoinMeeting = () => {
  return useMutation({
    mutationFn: (meetingId: string) =>
      studentMeetingApi.requestJoin(meetingId),
  });
};

export const useMeetingToken = (meetingId: string) => {
  return useQuery({
    queryKey: ["student", "meeting", "token", meetingId],
    queryFn: () => studentMeetingApi.getToken(meetingId),
    enabled: !!meetingId,
  });
};
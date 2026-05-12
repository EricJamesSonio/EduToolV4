import { useMutation, useQuery } from "@tanstack/react-query";
import { studentMeetingApi } from "@/api/student/meeting.api";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useStudentMeetings = (classId: string) => {
  return useQuery({
    queryKey: ["student", "meetings", classId],
    queryFn: () => studentMeetingApi.getAll(classId),
    enabled: !!classId,
    ...QUERY_CONFIGS.list,
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
    ...QUERY_CONFIGS.detail,
  });
};

export const useRequestJoinMeeting = () => {
  const standardOptions = createStandardMutationOptions({
    entity: "Meeting",
    operation: "update",
  });

  return useMutation({
    mutationFn: (meetingId: string) =>
      studentMeetingApi.requestJoin(meetingId),
    onSuccess: (data) => {
      standardOptions.onSuccess?.(data);
    },
    onError: standardOptions.onError,
  });
};

export const useMeetingToken = (meetingId: string) => {
  return useQuery({
    queryKey: ["student", "meeting", "token", meetingId],
    queryFn: () => studentMeetingApi.getToken(meetingId),
    enabled: !!meetingId,
    ...QUERY_CONFIGS.detail,
  });
};
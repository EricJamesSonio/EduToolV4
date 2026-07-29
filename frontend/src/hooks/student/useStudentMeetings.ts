import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentMeetingApi } from "@/api/student/meeting.api";

export const useStudentMeetings = (classId: string) => {
  return useAsyncQuery(
    queryKeys.student.meetings.list({ classId }),
    () => studentMeetingApi.getAll(classId),
    { enabled: !!classId },
  );
};

export const useStudentMeeting = (classId: string, meetingId: string) => {
  return useAsyncQuery(
    queryKeys.student.meetings.detail(meetingId),
    () => studentMeetingApi.getOne(classId, meetingId),
    { enabled: !!classId && !!meetingId },
  );
};

export const useRequestJoinMeeting = () => {
  return useMutationWithInvalidation(
    (meetingId: string) => studentMeetingApi.requestJoin(meetingId),
    { invalidateKeys: [] },
  );
};

export const useMeetingToken = (meetingId: string) => {
  return useAsyncQuery(
    queryKeys.student.meetings.detail(meetingId),
    () => studentMeetingApi.getToken(meetingId),
    { enabled: !!meetingId },
  );
};

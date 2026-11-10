import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentMeetingApi } from "@/api/student/meeting.api";

// Students do not hold a socket on the meetings pages, so these poll lightly
// to pick up a host ending (or starting) a meeting without a reload.
const MEETING_REFRESH_MS = 15_000;

export const useStudentMeetings = (classId: string) => {
  return useAsyncQuery(
    queryKeys.student.meetings.list({ classId }),
    () => studentMeetingApi.getAll(classId),
    { enabled: !!classId, refetchInterval: MEETING_REFRESH_MS },
  );
};

export const useStudentMeeting = (classId: string, meetingId: string) => {
  return useAsyncQuery(
    queryKeys.student.meetings.detail(meetingId),
    () => studentMeetingApi.getOne(classId, meetingId),
    { enabled: !!classId && !!meetingId, refetchInterval: MEETING_REFRESH_MS },
  );
};

export const useRequestJoinMeeting = () => {
  return useMutationWithInvalidation(
    (meetingId: string) => studentMeetingApi.requestJoin(meetingId),
    { invalidateKeys: [] },
  );
};

export const useMeetingToken = (meetingId: string) => {
  // Its own key: it used to share the meeting-detail key, so the room token
  // and the meeting details could overwrite each other in the cache.
  return useAsyncQuery(
    ["student", "meetings", "token", meetingId],
    () => studentMeetingApi.getToken(meetingId),
    { enabled: !!meetingId },
  );
};
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { meetingApi } from "@/api/educator/meeting.api";
import type {
  Meeting,
  MeetingToken,
  CreateMeetingDto,
  UpdateMeetingDto,
  EnrolledStudent,
} from "@/types/educator/meeting.types";

interface UseMeetingOptions {
  refetchInterval?: number | false;
}

export const useMeetings = (classId: string) => {
  return useAsyncQuery<Meeting[]>(
    queryKeys.educator.meetings.list(classId),
    () => meetingApi.getAll(classId),
    { enabled: !!classId },
  );
};

export const useMeeting = (
  classId: string,
  meetingId: string,
  options?: UseMeetingOptions
) => {
  return useAsyncQuery<Meeting>(
    queryKeys.educator.meetings.detail(meetingId),
    () => meetingApi.getOne(classId, meetingId),
    { enabled: !!classId && !!meetingId, refetchInterval: options?.refetchInterval },
  );
};

export const useEnrolledStudents = (
  classId: string
) => {
  return useAsyncQuery<EnrolledStudent[]>(
    queryKeys.educator.classes.students(classId),
    () => meetingApi.getEnrolledStudents(classId),
    { enabled: !!classId },
  );
};

export const useCreateMeeting = (classId: string) => {
  return useMutationWithInvalidation<Meeting, unknown, CreateMeetingDto>(
    (dto: CreateMeetingDto) => meetingApi.create(classId, dto),
    { invalidateKeys: [queryKeys.educator.meetings.list(classId)] },
  );
};

export const useUpdateMeeting = (classId: string) => {
  return useMutationWithInvalidation<Meeting, unknown, { meetingId: string; dto: UpdateMeetingDto }>(
    ({ meetingId, dto }) => meetingApi.update(classId, meetingId, dto),
    {
      invalidateKeys: [
        queryKeys.educator.meetings.list(classId),
      ],
    },
  );
};

export const useEndMeeting = (classId: string) => {
  return useMutationWithInvalidation<{ success: true; message: string }, unknown, string>(
    (meetingId: string) => meetingApi.end(classId, meetingId),
    { invalidateKeys: [queryKeys.educator.meetings.list(classId)] },
  );
};

export const useMeetingToken = (meetingId: string) => {
  return useAsyncQuery<MeetingToken>(
    queryKeys.educator.meetings.token(meetingId),
    () => meetingApi.getToken(meetingId),
    { enabled: !!meetingId },
  );
};

export const useRespondToJoinRequest = (classId: string, meetingId: string) => {
  return useMutationWithInvalidation<void, unknown, { reqId: string; status: "accepted" | "declined" }>(
    ({ reqId, status }) => meetingApi.respondToJoinRequest(meetingId, reqId, status),
    { invalidateKeys: [queryKeys.educator.meetings.detail(meetingId)] },
  );
};

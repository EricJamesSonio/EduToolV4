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
import { useQueryClient } from "@tanstack/react-query";


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
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<{ success: true; message: string }, unknown, string>(
    async (meetingId: string) => {
      const result = await meetingApi.end(classId, meetingId);

      // Flip the cached meeting to "ended" right away so every open page
      // (detail, room, list) updates without waiting for a refetch.
      queryClient.setQueryData<Meeting>(
        queryKeys.educator.meetings.detail(meetingId),
        (old) => (old ? { ...old, status: "ended" } : old),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.educator.meetings.detail(meetingId),
      });

      return result;
    },
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

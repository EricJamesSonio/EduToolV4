import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
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

const KEY = {
  list:     (classId: string) => ["meetings", classId] as const,
  detail:   (classId: string, meetingId: string) => ["meetings", classId, meetingId] as const,
  students: (classId: string) => ["class-students", classId] as const,
};

export const useMeetings = (classId: string): UseQueryResult<Meeting[]> => {
  return useQuery({
    queryKey: KEY.list(classId),
    queryFn:  () => meetingApi.getAll(classId),
    enabled:  !!classId,
  });
};

export const useMeeting = (
  classId: string,
  meetingId: string,
  options?: UseMeetingOptions
): UseQueryResult<Meeting> => {
  return useQuery({
    queryKey: KEY.detail(classId, meetingId),
    queryFn:  () => meetingApi.getOne(classId, meetingId),
    enabled:  !!classId && !!meetingId,
    refetchInterval: options?.refetchInterval,
  });
};

export const useEnrolledStudents = (
  classId: string
): UseQueryResult<EnrolledStudent[]> => {
  return useQuery({
    queryKey: KEY.students(classId),
    queryFn:  () => meetingApi.getEnrolledStudents(classId),
    enabled:  !!classId,
  });
};

export const useCreateMeeting = (
  classId: string
): UseMutationResult<Meeting, unknown, CreateMeetingDto> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => meetingApi.create(classId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.list(classId) });
    },
  });
};

export const useUpdateMeeting = (
  classId: string
): UseMutationResult<Meeting, unknown, { meetingId: string; dto: UpdateMeetingDto }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }) => meetingApi.update(classId, meetingId, dto),
    onSuccess: (_, { meetingId }) => {
      qc.invalidateQueries({ queryKey: KEY.list(classId) });
      qc.invalidateQueries({ queryKey: KEY.detail(classId, meetingId) });
    },
  });
};

export const useEndMeeting = (
  classId: string
): UseMutationResult<{ success: true; message: string }, unknown, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => meetingApi.end(classId, meetingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.list(classId) });
    },
  });
};

export const useMeetingToken = (meetingId: string): UseQueryResult<MeetingToken> => {
  return useQuery({
    queryKey: ["educator", "meeting", "token", meetingId],
    queryFn:  () => meetingApi.getToken(meetingId),
    enabled:  !!meetingId,
  });
};

export const useRespondToJoinRequest = (
  classId: string,
  meetingId: string
): UseMutationResult<void, unknown, { reqId: string; status: "accepted" | "declined" }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, status }) =>
      meetingApi.respondToJoinRequest(meetingId, reqId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.detail(classId, meetingId) });
    },
  });
};
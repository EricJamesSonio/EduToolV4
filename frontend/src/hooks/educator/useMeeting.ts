import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { meetingApi, CreateMeetingDto, UpdateMeetingDto, Meeting } from "@/api/educator/meeting.api";

const MEETINGS_KEY = "meetings";

// Fetch all meetings
export const useMeetings = (classId: string): UseQueryResult<Meeting[]> => {
  return useQuery<Meeting[]>({
    queryKey: [MEETINGS_KEY, classId],
    queryFn: () => meetingApi.getAll(classId),
    enabled: !!classId,
  });
};

// Fetch one meeting
export const useMeeting = (classId: string, meetingId: string): UseQueryResult<Meeting> => {
  return useQuery<Meeting>({
    queryKey: [MEETINGS_KEY, classId, meetingId],
    queryFn: () => meetingApi.getOne(classId, meetingId),
    enabled: !!classId && !!meetingId,
  });
};

// Create a meeting
export const useCreateMeeting = (classId: string): UseMutationResult<Meeting, unknown, CreateMeetingDto> => {
  const qc = useQueryClient();
  return useMutation<Meeting, unknown, CreateMeetingDto>({
    mutationFn: (dto) => meetingApi.create(classId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
    },
  });
};

// Update a meeting
export const useUpdateMeeting = (classId: string): UseMutationResult<Meeting, unknown, { meetingId: string; dto: UpdateMeetingDto }> => {
  const qc = useQueryClient();
  return useMutation<Meeting, unknown, { meetingId: string; dto: UpdateMeetingDto }>({
    mutationFn: ({ meetingId, dto }) => meetingApi.update(classId, meetingId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId, vars.meetingId] });
    },
  });
};

// End a meeting
export const useEndMeeting = (classId: string): UseMutationResult<{ success: true; message: string }, unknown, string> => {
  const qc = useQueryClient();
  return useMutation<{ success: true; message: string }, unknown, string>({
    mutationFn: (meetingId) => meetingApi.end(classId, meetingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
    },
  });
};
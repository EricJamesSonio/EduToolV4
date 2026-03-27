// src/hooks/educator/useMeetings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingApi, CreateMeetingDto, UpdateMeetingDto } from "@/api/educator/meeting.api";

const MEETINGS_KEY = "meetings";

// Fetch all meetings
export const useMeetings = (classId: string) => {
  return useQuery({
    queryKey: [MEETINGS_KEY, classId],
    queryFn: () => meetingApi.getAll(classId),
    enabled: !!classId,
  });
};

// Fetch one meeting
export const useMeeting = (classId: string, meetingId: string) => {
  return useQuery({
    queryKey: [MEETINGS_KEY, classId, meetingId],
    queryFn: () => meetingApi.getOne(classId, meetingId),
    enabled: !!classId && !!meetingId,
  });
};

// Create a meeting
export const useCreateMeeting = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMeetingDto) => meetingApi.create(classId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
    },
  });
};

// Update a meeting
export const useUpdateMeeting = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, dto }: { meetingId: string; dto: UpdateMeetingDto }) =>
      meetingApi.update(classId, meetingId, dto),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId, vars.meetingId] });
    },
  });
};

// End a meeting
export const useEndMeeting = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: string) => meetingApi.end(classId, meetingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MEETINGS_KEY, classId] });
    },
  });
};
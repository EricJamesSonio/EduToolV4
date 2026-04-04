// filepath: frontend/src/hooks/educator/useLessons.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  lessonApi,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "@/api/educator/lesson.api";

const LESSONS_KEY = "lessons";

export const useLessons = (classId: string, weekNumber?: number) => {
  return useQuery({
    queryKey: [LESSONS_KEY, classId, weekNumber],
    queryFn: () => lessonApi.getAll(classId, weekNumber),
    enabled: !!classId,
  });
};

export const useLesson = (classId: string, lessonId: string) => {
  return useQuery({
    queryKey: [LESSONS_KEY, classId, lessonId],
    queryFn: () => lessonApi.getOne(classId, lessonId),
    enabled: !!classId && !!lessonId,
  });
};

export const useCreateLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonRequest) => lessonApi.create(classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_KEY, classId] });
    },
  });
};

export const useUpdateLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      data,
    }: {
      lessonId: string;
      data: UpdateLessonRequest;
    }) => lessonApi.update(classId, lessonId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: [LESSONS_KEY, classId] });
      qc.invalidateQueries({
        queryKey: [LESSONS_KEY, classId, variables.lessonId],
      });
    },
  });
};

export const useDeleteLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => lessonApi.delete(classId, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [LESSONS_KEY, classId] });
    },
  });
};

export const useTriggerExtraction = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) =>
      lessonApi.triggerExtraction(classId, lessonId),
    onSuccess: (_, lessonId) => {
      qc.invalidateQueries({ queryKey: [LESSONS_KEY, classId, lessonId] });
    },
  });
};
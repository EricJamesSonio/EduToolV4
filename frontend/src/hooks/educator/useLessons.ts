// filepath: frontend/src/hooks/educator/useLessons.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  lessonApi,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "@/api/educator/lesson.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useAppQuery } from "@/hooks/useAppQuery";
import { toast } from "sonner";

export const useLessons = (classId: string, weekNumber?: number) => {
  return useAsyncQuery(
    queryKeys.educator.lessons.list(classId, { weekNumber }),
    () => lessonApi.getAll(classId, weekNumber),
    {
      meta: { preset: 'list', feature: 'lessons' },
      enabled: !!classId,
    },
  );
};

export const useLesson = (classId: string, lessonId: string, poll = false) => {
  return useAppQuery(
    queryKeys.educator.lessons.detail(lessonId),
    () => lessonApi.getOne(classId, lessonId),
    {
      meta: { preset: poll ? 'realtime' : 'detail', feature: 'lessons' },
      enabled: !!classId && !!lessonId,
      staleTime: poll ? 0 : 1000 * 60 * 2,
      refetchInterval: poll ? 3000 : false,
    },
  );
};

export const useCreateLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonRequest) => lessonApi.create(classId, data),
    onSuccess: (newLesson) => {
      qc.setQueryData(queryKeys.educator.lessons.detail(newLesson.id), newLesson);
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.all });
      toast.success("Lesson created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create lesson");
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
    onMutate: async ({ lessonId, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.educator.lessons.detail(lessonId) });

      const previousLesson = qc.getQueryData(queryKeys.educator.lessons.detail(lessonId));

      qc.setQueryData(queryKeys.educator.lessons.detail(lessonId), (old: any) =>
        old ? { ...old, ...data } : null
      );

      return { previousLesson };
    },
    onError: (err, variables, context) => {
      if (context?.previousLesson) {
        qc.setQueryData(queryKeys.educator.lessons.detail(variables.lessonId), context.previousLesson);
      }
      toast.error("Failed to update lesson");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.detail(variables.lessonId) });
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.all });
    },
    onSuccess: () => {
      toast.success("Lesson updated successfully");
    },
  });
};

export const useDeleteLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => lessonApi.delete(classId, lessonId),
    onMutate: async (lessonId) => {
      await qc.cancelQueries({ queryKey: queryKeys.educator.lessons.detail(lessonId) });

      const previousLesson = qc.getQueryData(queryKeys.educator.lessons.detail(lessonId));

      qc.removeQueries({ queryKey: queryKeys.educator.lessons.detail(lessonId) });

      return { previousLesson };
    },
    onError: (err, variables, context) => {
      if (context?.previousLesson) {
        qc.setQueryData(queryKeys.educator.lessons.detail(variables), context.previousLesson);
      }
      toast.error("Failed to delete lesson");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.all });
    },
    onSuccess: () => {
      toast.success("Lesson deleted successfully");
    },
  });
};

export const useTriggerExtraction = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, detail }: { lessonId: string; detail: string }) =>
      lessonApi.triggerExtraction(classId, lessonId, detail),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.detail(variables.lessonId) });
      toast.success("Content extraction triggered successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to trigger content extraction");
    },
  });
};

export const useConceptBuild = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, detail }: { lessonId: string; detail: string }) =>
      lessonApi.conceptBuild(classId, lessonId, detail),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.educator.lessons.detail(variables.lessonId) });
      toast.success("Concept build completed");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to build concepts");
    },
  });
};
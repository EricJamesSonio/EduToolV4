// filepath: frontend/src/hooks/educator/useLessons.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  lessonApi,
  CreateLessonRequest,
  UpdateLessonRequest,
} from "@/api/educator/lesson.api";
import { lessonKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export const useLessons = (classId: string, weekNumber?: number) => {
  return useQuery({
    queryKey: lessonKeys.list({ classId, weekNumber }),
    queryFn: () => lessonApi.getAll(classId, weekNumber),
    enabled: !!classId,
    staleTime: 1000 * 30, // 30 seconds for lessons (frequently updated)
  });
};

export const useLesson = (classId: string, lessonId: string, poll = false) => {
  return useQuery({
    queryKey: lessonKeys.detail(lessonId),
    queryFn: () => lessonApi.getOne(classId, lessonId),
    enabled: !!classId && !!lessonId,
    staleTime: poll ? 0 : 1000 * 60 * 2,
    refetchInterval: poll ? 3000 : false,
  });
};

export const useCreateLesson = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLessonRequest) => lessonApi.create(classId, data),
    onSuccess: (newLesson) => {
      qc.setQueryData(lessonKeys.detail(newLesson.id), newLesson);
      qc.invalidateQueries({ queryKey: lessonKeys.lists() });
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
      await qc.cancelQueries({ queryKey: lessonKeys.detail(lessonId) });

      const previousLesson = qc.getQueryData(lessonKeys.detail(lessonId));

      qc.setQueryData(lessonKeys.detail(lessonId), (old: any) =>
        old ? { ...old, ...data } : null
      );

      return { previousLesson };
    },
    onError: (err, variables, context) => {
      if (context?.previousLesson) {
        qc.setQueryData(lessonKeys.detail(variables.lessonId), context.previousLesson);
      }
      toast.error("Failed to update lesson");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: lessonKeys.detail(variables.lessonId) });
      qc.invalidateQueries({ queryKey: lessonKeys.lists() });
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
      await qc.cancelQueries({ queryKey: lessonKeys.detail(lessonId) });

      const previousLesson = qc.getQueryData(lessonKeys.detail(lessonId));

      qc.removeQueries({ queryKey: lessonKeys.detail(lessonId) });

      return { previousLesson };
    },
    onError: (err, variables, context) => {
      if (context?.previousLesson) {
        qc.setQueryData(lessonKeys.detail(variables), context.previousLesson);
      }
      toast.error("Failed to delete lesson");
    },
    onSettled: (data, error, variables) => {
      qc.invalidateQueries({ queryKey: lessonKeys.lists() });
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
      qc.invalidateQueries({ queryKey: lessonKeys.detail(variables.lessonId) });
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
      qc.invalidateQueries({ queryKey: lessonKeys.detail(variables.lessonId) });
      toast.success("Concept build completed");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to build concepts");
    },
  });
};
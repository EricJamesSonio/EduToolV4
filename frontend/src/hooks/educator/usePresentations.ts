import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { presentationApi } from "@/api/educator/presentation.api";
import type {
  Presentation,
  CreatePresentationRequest,
  UpdatePresentationRequest,
  GenerateSlidesRequest,
} from "@/types/educator/presentation.types";

const KEY = {
  all: (classId: string) => ["educator", "presentations", classId] as const,
  one: (classId: string, id: string) => ["educator", "presentations", classId, id] as const,
  byLesson: (classId: string, lessonId: string) => ["educator", "presentations", classId, "lesson", lessonId] as const,
};

export function usePresentations(classId: string) {
  return useQuery({
    queryKey: KEY.all(classId),
    queryFn: () => presentationApi.getAll(classId),
    enabled: !!classId,
  });
}

export function usePresentation(classId: string, id: string) {
  return useQuery({
    queryKey: KEY.one(classId, id),
    queryFn: () => presentationApi.getOne(classId, id),
    enabled: !!classId && !!id,
  });
}

export function usePresentationByLesson(classId: string, lessonId: string) {
  return useQuery({
    queryKey: KEY.byLesson(classId, lessonId),
    queryFn: () => presentationApi.getByLesson(classId, lessonId),
    enabled: !!classId && !!lessonId,
  });
}

export function useCreatePresentation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePresentationRequest) => presentationApi.create(classId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.all(classId) });
    },
  });
}

export function useUpdatePresentation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePresentationRequest }) =>
      presentationApi.update(classId, id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY.all(classId) });
      qc.invalidateQueries({ queryKey: KEY.one(classId, variables.id) });
    },
  });
}

export function useDeletePresentation(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presentationApi.delete(classId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY.all(classId) });
    },
  });
}

export function useGenerateSlides(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: GenerateSlidesRequest }) =>
      presentationApi.generateSlides(classId, id, body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: KEY.one(classId, variables.id) });
    },
  });
}

export function useAutoGenerateSlides(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presentationApi.autoGenerate(classId, id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: KEY.one(classId, id) });
    },
  });
}

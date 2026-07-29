import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { presentationApi } from "@/api/educator/presentation.api";
import type {
  Presentation,
  CreatePresentationRequest,
  UpdatePresentationRequest,
  GenerateSlidesRequest,
} from "@/types/educator/presentation.types";

export function usePresentations(classId: string) {
  return useAsyncQuery<Presentation[]>(
    queryKeys.educator.presentations.list(classId),
    () => presentationApi.getAll(classId),
    { enabled: !!classId },
  );
}

export function usePresentation(classId: string, id: string) {
  return useAsyncQuery<Presentation>(
    [...queryKeys.educator.presentations.all, 'detail', classId, id] as const,
    () => presentationApi.getOne(classId, id),
    { enabled: !!classId && !!id },
  );
}

export function usePresentationByLesson(classId: string, lessonId: string) {
  return useAsyncQuery<Presentation>(
    [...queryKeys.educator.presentations.all, 'byLesson', classId, lessonId] as const,
    () => presentationApi.getByLesson(classId, lessonId),
    { enabled: !!classId && !!lessonId },
  );
}

export function useCreatePresentation(classId: string) {
  return useMutationWithInvalidation(
    (body: CreatePresentationRequest) => presentationApi.create(classId, body),
    { invalidateKeys: [queryKeys.educator.presentations.list(classId)] },
  );
}

export function useUpdatePresentation(classId: string) {
  return useMutationWithInvalidation(
    ({ id, body }: { id: string; body: UpdatePresentationRequest }) =>
      presentationApi.update(classId, id, body),
    { invalidateKeys: [queryKeys.educator.presentations.list(classId)] },
  );
}

export function useDeletePresentation(classId: string) {
  return useMutationWithInvalidation(
    (id: string) => presentationApi.delete(classId, id),
    { invalidateKeys: [queryKeys.educator.presentations.list(classId)] },
  );
}

export function useGenerateSlides(classId: string) {
  return useMutationWithInvalidation(
    ({ id, body }: { id: string; body: GenerateSlidesRequest }) =>
      presentationApi.generateSlides(classId, id, body),
    { invalidateKeys: [queryKeys.educator.presentations.list(classId)] },
  );
}

export function useAutoGenerateSlides(classId: string) {
  return useMutationWithInvalidation(
    (id: string) => presentationApi.autoGenerate(classId, id),
    { invalidateKeys: [queryKeys.educator.presentations.list(classId)] },
  );
}

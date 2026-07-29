import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { subjectApi } from "@/api/admin/subject.api";
import type {
  GetSubjectsQuery,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  ShareSubjectRequest,
} from "@/api/admin/subject.api";
import type { Subject, SubjectSharing } from "@/types/admin/subject.types";

export const useSubjects = (query?: GetSubjectsQuery) => {
  return useAsyncQuery<Subject[]>(
    queryKeys.admin.subjects.list(query),
    () => subjectApi.getAll(query),
  );
};

export const useSubject = (id: string) => {
  return useAsyncQuery<Subject>(
    queryKeys.admin.subjects.detail(id),
    () => subjectApi.getOne(id),
    { enabled: !!id },
  );
};

export const useCreateSubject = () => {
  return useMutationWithInvalidation<Subject, Error, CreateSubjectRequest>(
    subjectApi.create,
    { invalidateKeys: [queryKeys.admin.subjects.all] },
  );
};

export const useUpdateSubject = () => {
  return useMutationWithInvalidation<Subject, Error, { id: string; data: UpdateSubjectRequest }>(
    ({ id, data }: { id: string; data: UpdateSubjectRequest }) => subjectApi.update(id, data),
    { invalidateKeys: [queryKeys.admin.subjects.all] },
  );
};

export const useLockSubject = () => {
  return useMutationWithInvalidation<{ success: true }, Error, string>(
    subjectApi.lock,
    { invalidateKeys: [queryKeys.admin.subjects.all] },
  );
};

export const useUnlockSubject = () => {
  return useMutationWithInvalidation<{ success: true }, Error, string>(
    subjectApi.unlock,
    { invalidateKeys: [queryKeys.admin.subjects.all] },
  );
};

export const useSubjectSharings = (subjectId: string) => {
  return useAsyncQuery<SubjectSharing[]>(
    [...queryKeys.admin.subjects.all, 'sharings', subjectId] as const,
    () => subjectApi.getSharings(subjectId),
    { enabled: !!subjectId },
  );
};

export const useShareSubject = () => {
  return useMutationWithInvalidation<SubjectSharing, Error, { id: string; data: ShareSubjectRequest }>(
    ({ id, data }: { id: string; data: ShareSubjectRequest }) => subjectApi.share(id, data),
    {
      invalidateKeys: (result, variables) => [
        queryKeys.admin.subjects.detail(variables.id),
        [...queryKeys.admin.subjects.all, 'sharings', variables.id] as const,
      ],
    },
  );
};

export const useUnshareSubject = () => {
  return useMutationWithInvalidation<{ success: true }, Error, { id: string; sharingId: string }>(
    ({ id, sharingId }: { id: string; sharingId: string }) => subjectApi.unshare(id, sharingId),
    {
      invalidateKeys: (result, variables) => [
        queryKeys.admin.subjects.detail(variables.id),
        [...queryKeys.admin.subjects.all, 'sharings', variables.id] as const,
      ],
    },
  );
};

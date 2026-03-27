import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { subjectApi } from "@/api/admin/subject.api";
import type { GetSubjectsQuery, CreateSubjectRequest, UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject } from "@/types/admin/subject.types";

export const useSubjects = (query?: GetSubjectsQuery): UseQueryResult<Subject[], Error> => {
  return useQuery({
    queryKey: ["subjects", query],
    queryFn: () => subjectApi.getAll(query),
  });
};

export const useSubject = (id: string): UseQueryResult<Subject, Error> => {
  return useQuery({
    queryKey: ["subjects", id],
    queryFn: () => subjectApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateSubject = (): UseMutationResult<Subject, Error, CreateSubjectRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUpdateSubject = (): UseMutationResult<Subject, Error, { id: string; data: UpdateSubjectRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectRequest }) =>
      subjectApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useLockSubject = (): UseMutationResult<{ success: true }, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.lock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUnlockSubject = (): UseMutationResult<{ success: true }, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.unlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};
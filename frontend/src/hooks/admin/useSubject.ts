import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subjectApi } from "@/api/admin/subject.api";
import type { GetSubjectsQuery } from "@/api/admin/subject.api";

export const useSubjects = (query?: GetSubjectsQuery) => {
  return useQuery({
    queryKey: ["subjects", query],
    queryFn: () => subjectApi.getAll(query),
  });
};

export const useSubject = (id: string) => {
  return useQuery({
    queryKey: ["subjects", id],
    queryFn: () => subjectApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      subjectApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useLockSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.lock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};

export const useUnlockSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subjectApi.unlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
};
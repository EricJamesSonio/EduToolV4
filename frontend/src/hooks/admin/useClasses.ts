import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classApi } from "@/api/admin/class.api";
import type { GetClassesQuery } from "@/api/admin/class.api";

export const useClasses = (query?: GetClassesQuery) => {
  return useQuery({
    queryKey: ["classes", query],
    queryFn: () => classApi.getAll(query),
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => classApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

export const useArchiveClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

export const useClassEnrollments = (classId: string) => {
  return useQuery({
    queryKey: ["classes", classId, "enrollments"],
    queryFn: () => classApi.getEnrollments(classId),
    enabled: !!classId,
  });
};

export const useEnrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
    }: {
      classId: string;
      studentId: string;
    }) => classApi.enroll(classId, studentId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

export const useUpdateEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
      status,
    }: {
      classId: string;
      enrollmentId: string;
      status: "active" | "pending" | "removed";
    }) => classApi.updateEnrollment(classId, enrollmentId, status),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

export const useRemoveEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      enrollmentId,
    }: {
      classId: string;
      enrollmentId: string;
    }) => classApi.removeEnrollment(classId, enrollmentId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};
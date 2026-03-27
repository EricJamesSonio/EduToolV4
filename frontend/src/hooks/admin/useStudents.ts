import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/api/admin/student.api";
import type { GetStudentsQuery } from "@/api/admin/student.api";

export const useStudents = (query?: GetStudentsQuery) => {
  return useQuery({
    queryKey: ["students", query],
    queryFn: () => studentApi.getAll(query),
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => studentApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      studentApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useResetStudentPassword = () => {
  return useMutation({
    mutationFn: studentApi.resetPassword,
  });
};

export const useStudentEnrollments = (studentId: string) => {
  return useQuery({
    queryKey: ["students", studentId, "enrollments"],
    queryFn: () => studentApi.getEnrollments(studentId),
    enabled: !!studentId,
  });
};

export const useAddStudentEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      classId,
    }: {
      studentId: string;
      classId: string;
    }) => studentApi.addEnrollment(studentId, classId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["students", variables.studentId, "enrollments"],
      });
    },
  });
};

export const useRemoveStudentEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      enrollmentId,
    }: {
      studentId: string;
      enrollmentId: string;
    }) => studentApi.removeEnrollment(studentId, enrollmentId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["students", variables.studentId, "enrollments"],
      });
    },
  });
};
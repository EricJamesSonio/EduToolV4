import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import {
  studentApi,
  CreateStudentRequest,
  CreateStudentResponse,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
  GetStudentsQuery,
  StudentEnrollment,
  AddEnrollmentResponse
} from "@/api/admin/student.api";
import type { Student } from "@/types/admin/student.types";

// Fetch all students with optional query
export const useStudents = (query?: GetStudentsQuery): UseQueryResult<Student[]> => {
  return useQuery({
    queryKey: ["students", query],
    queryFn: () => studentApi.getAll(query),
  });
};

// Fetch a single student by ID
export const useStudent = (id: string): UseQueryResult<Student> => {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => studentApi.getOne(id),
    enabled: !!id,
  });
};

// Create a new student
export const useCreateStudent = (): UseMutationResult<CreateStudentResponse, unknown, CreateStudentRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

// Update an existing student
export const useUpdateStudent = (): UseMutationResult<Student, unknown, { id: string; data: UpdateStudentRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => studentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

// Update student status
export const useUpdateStudentStatus = (): UseMutationResult<Student, unknown, { id: string; data: UpdateStudentStatusRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => studentApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

// Reset student password
export const useResetStudentPassword = (): UseMutationResult<{ password: string }, unknown, string> => {
  return useMutation({
    mutationFn: studentApi.resetPassword,
  });
};

// Fetch student enrollments
export const useStudentEnrollments = (studentId: string): UseQueryResult<StudentEnrollment[]> => {
  return useQuery({
    queryKey: ["students", studentId, "enrollments"],
    queryFn: () => studentApi.getEnrollments(studentId),
    enabled: !!studentId,
  });
};

// Add student enrollment
export const useAddStudentEnrollment = (): UseMutationResult<AddEnrollmentResponse, unknown, { studentId: string; classId: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, classId }) => studentApi.addEnrollment(studentId, classId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["students", variables.studentId, "enrollments"],
      });
    },
  });
};

// Remove student enrollment
export const useRemoveStudentEnrollment = (): UseMutationResult<void, unknown, { studentId: string; enrollmentId: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, enrollmentId }) => studentApi.removeEnrollment(studentId, enrollmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["students", variables.studentId, "enrollments"],
      });
    },
  });
};
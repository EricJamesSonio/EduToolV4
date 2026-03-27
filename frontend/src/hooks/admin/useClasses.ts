import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { classApi } from "@/api/admin/class.api";
import type {
  GetClassesQuery,
  CreateClassRequest,
  UpdateClassRequest,
  EnrollmentResponse,
  EnrollOverflowResponse,
} from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";

// Fetch all classes
export const useClasses = (query?: GetClassesQuery): UseQueryResult<Class[], Error> => {
  return useQuery({
    queryKey: ["classes", query],
    queryFn: () => classApi.getAll(query),
  });
};

// Fetch single class by ID
export const useClass = (id: string): UseQueryResult<Class, Error> => {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => classApi.getOne(id),
    enabled: !!id,
  });
};

// Create a class
export const useCreateClass = (): UseMutationResult<Class, Error, CreateClassRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

// Update a class
export const useUpdateClass = (): UseMutationResult<
  Class,
  Error,
  { id: string; data: UpdateClassRequest }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => classApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

// Archive a class
export const useArchiveClass = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

// Get enrollments for a class
export const useClassEnrollments = (classId: string): UseQueryResult<EnrollmentResponse[], Error> => {
  return useQuery({
    queryKey: ["classes", classId, "enrollments"],
    queryFn: () => classApi.getEnrollments(classId),
    enabled: !!classId,
  });
};

// Enroll a student in a class
export const useEnrollStudent = (): UseMutationResult<
  EnrollmentResponse | EnrollOverflowResponse,
  Error,
  { classId: string; studentId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, studentId }) => classApi.enroll(classId, studentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

// Update enrollment status
export const useUpdateEnrollment = (): UseMutationResult<
  EnrollmentResponse,
  Error,
  { classId: string; enrollmentId: string; status: "active" | "pending" | "removed" }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, enrollmentId, status }) =>
      classApi.updateEnrollment(classId, enrollmentId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};

// Remove an enrollment
export const useRemoveEnrollment = (): UseMutationResult<
  { success: true },
  Error,
  { classId: string; enrollmentId: string }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, enrollmentId }) => classApi.removeEnrollment(classId, enrollmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "enrollments"],
      });
    },
  });
};
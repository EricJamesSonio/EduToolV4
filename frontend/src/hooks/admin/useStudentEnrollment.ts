import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
  EnrollStudentRequest,
  BulkEnrollStudentsRequest,
  BulkEnrollResult,
  UpdateSchoolYearEnrollmentRequest,
  EnrollStudentProgramRequest,
  UpdateProgramEnrollmentRequest,
} from "@/types/admin/student-enrollment.types";

const KEY = (schoolYearId: string) =>
  ["admin", "school-year-enrollments", schoolYearId] as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export const useSchoolYearEnrollments = (
  schoolYearId: string,
): UseQueryResult<StudentSchoolYearEnrollment[], Error> =>
  useQuery({
    queryKey: KEY(schoolYearId),
    queryFn: () => studentEnrollmentApi.getBySchoolYear(schoolYearId),
    enabled: !!schoolYearId,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useEnrollStudent = (
  schoolYearId: string,
): UseMutationResult<
  StudentSchoolYearEnrollment,
  Error,
  EnrollStudentRequest
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => studentEnrollmentApi.enroll(schoolYearId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useBulkEnrollStudents = (
  schoolYearId: string,
): UseMutationResult<
  BulkEnrollResult,
  Error,
  BulkEnrollStudentsRequest
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      studentEnrollmentApi.bulkEnroll(schoolYearId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useUpdateSchoolYearEnrollment = (
  schoolYearId: string,
): UseMutationResult<
  StudentSchoolYearEnrollment,
  Error,
  { enrollmentId: string; data: UpdateSchoolYearEnrollmentRequest }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, data }) =>
      studentEnrollmentApi.updateEnrollment(
        schoolYearId,
        enrollmentId,
        data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useUnenrollStudent = (
  schoolYearId: string,
): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId) =>
      studentEnrollmentApi.unenroll(schoolYearId, enrollmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useEnrollInProgram = (
  schoolYearId: string,
): UseMutationResult<
  ProgramEnrollmentSnapshot,
  Error,
  { studentId: string; data: EnrollStudentProgramRequest }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, data }) =>
      studentEnrollmentApi.enrollInProgram(
        schoolYearId,
        studentId,
        data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useUpdateProgramEnrollment = (
  schoolYearId: string,
): UseMutationResult<
  ProgramEnrollmentSnapshot,
  Error,
  { programEnrollmentId: string; data: UpdateProgramEnrollmentRequest }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programEnrollmentId, data }) =>
      studentEnrollmentApi.updateProgramEnrollment(
        schoolYearId,
        programEnrollmentId,
        data,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};

export const useRemoveProgramEnrollment = (
  schoolYearId: string,
): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programEnrollmentId) =>
      studentEnrollmentApi.removeProgramEnrollment(
        schoolYearId,
        programEnrollmentId,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(schoolYearId) }),
  });
};
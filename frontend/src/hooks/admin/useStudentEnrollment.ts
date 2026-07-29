// frontend/src/hooks/admin/useStudentEnrollment.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

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


import { queryKeys } from "@/hooks/queryKeys.factory"


// ── QUERY ─────────────────────────────────────────────

export const useSchoolYearEnrollments = (
  schoolYearId: string,
) => {
  return useAsyncQuery<
    StudentSchoolYearEnrollment[]
  >(
    queryKeys.admin.studentEnrollment.list({ schoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(schoolYearId),

    {
      enabled: !!schoolYearId,
    },
  );
};


// ── MUTATIONS ─────────────────────────────────────────


// Enroll student

export const useEnrollStudent = (
  schoolYearId: string,
) => {
  return useMutationWithInvalidation(
    (data: EnrollStudentRequest) =>
      studentEnrollmentApi.enroll(
        schoolYearId,
        data,
      ),

    {
      invalidateKeys: [
        enrollmentKeys.bySchoolYear(
          schoolYearId,
        ),
      ],
    },
  );
};


// Bulk enroll

export const useBulkEnrollStudents = (
  schoolYearId: string,
) => {
  return useMutationWithInvalidation(
    (data: BulkEnrollStudentsRequest) =>
      studentEnrollmentApi.bulkEnroll(
        schoolYearId,
        data,
      ),

    {
      invalidateKeys: [
        enrollmentKeys.bySchoolYear(
          schoolYearId,
        ),
      ],
    },
  );
};


// Update school year enrollment

export const useUpdateSchoolYearEnrollment =
  (schoolYearId: string) => {
    return useMutationWithInvalidation(
      ({
        enrollmentId,
        data,
      }: {
        enrollmentId: string;
        data: UpdateSchoolYearEnrollmentRequest;
      }) =>
        studentEnrollmentApi.updateEnrollment(
          schoolYearId,
          enrollmentId,
          data,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.studentEnrollment.list({ schoolYearId }),
        ],
      },
    );
  };


// Unenroll student

export const useUnenrollStudent = (
  schoolYearId: string,
) => {
  return useMutationWithInvalidation(
    (enrollmentId: string) =>
      studentEnrollmentApi.unenroll(
        schoolYearId,
        enrollmentId,
      ),

    {
      invalidateKeys: [
        enrollmentKeys.bySchoolYear(
          schoolYearId,
        ),
      ],
    },
  );
};


// Enroll in program

export const useEnrollInProgram = (
  schoolYearId: string,
) => {
  return useMutationWithInvalidation(
    ({
      studentId,
      data,
    }: {
      studentId: string;
      data: EnrollStudentProgramRequest;
    }) =>
      studentEnrollmentApi.enrollInProgram(
        schoolYearId,
        studentId,
        data,
      ),

    {
      invalidateKeys: [
        enrollmentKeys.bySchoolYear(
          schoolYearId,
        ),
      ],
    },
  );
};


// Update program enrollment

export const useUpdateProgramEnrollment =
  (schoolYearId: string) => {
    return useMutationWithInvalidation(
      ({
        programEnrollmentId,
        data,
      }: {
        programEnrollmentId: string;
        data: UpdateProgramEnrollmentRequest;
      }) =>
        studentEnrollmentApi.updateProgramEnrollment(
          schoolYearId,
          programEnrollmentId,
          data,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.studentEnrollment.list({ schoolYearId }),
        ],
      },
    );
  };


// Remove program enrollment

export const useRemoveProgramEnrollment =
  (schoolYearId: string) => {
    return useMutationWithInvalidation(
      (programEnrollmentId: string) =>
        studentEnrollmentApi.removeProgramEnrollment(
          schoolYearId,
          programEnrollmentId,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.studentEnrollment.list({ schoolYearId }),
        ],
      },
    );
  };
import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useSetRegularStudent = (schoolYearId: string) => {
  return useMutationWithInvalidation(
    ({
      programEnrollmentId,
      isRegular,
    }: {
      programEnrollmentId: string;
      isRegular: boolean;
    }) =>
      studentEnrollmentApi.setRegular(schoolYearId, programEnrollmentId, {
        is_regular: isRegular,
      }),

    {
      invalidateKeys: [
        queryKeys.admin.studentEnrollment.list({ schoolYearId }),
        queryKeys.admin.students.all,
        queryKeys.admin.subjectPrerequisites.all,
      ],
    },
  );
};
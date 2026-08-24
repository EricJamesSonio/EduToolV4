import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { programShiftApi, type ShiftProgramRequest } from "@/api/admin/program-shift.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useProgramShift = (schoolYearId: string, studentSchoolYearId: string) => {
  return useMutationWithInvalidation(
    (data: ShiftProgramRequest) => programShiftApi.shift(schoolYearId, studentSchoolYearId, data),
    {
      invalidateKeys: [
        queryKeys.admin.students.detail(studentSchoolYearId),
        queryKeys.admin.studentEnrollment.list({ schoolYearId }),
      ],
    },
  );
};

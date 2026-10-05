import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { gradeApi, ManualScoreDto, AssessmentStatusOverrideResult } from "@/api/educator/grade.api";
import type { TermGrades } from "@/types/educator/grade.types";

export const useClassGrades = (classId: string) => {
  return useAsyncQuery(
    queryKeys.educator.grades.list(classId, ''),
    () => gradeApi.getByClass(classId),
    { enabled: !!classId },
  );
};

export const useTermGrades = (classId: string, termId: string) => {
  return useAsyncQuery(
    queryKeys.educator.grades.list(classId, termId),
    () => gradeApi.getByTerm(classId, termId),
    { enabled: !!classId && !!termId },
  );
};

export const useComputeGrades = (classId: string, termId: string) => {
  return useMutationWithInvalidation(
    () => gradeApi.compute(classId, termId),
    { invalidateKeys: [queryKeys.educator.grades.list(classId, '')] },
  );
};

/**
 * Commits a manual category score for one student.
 *
 * `studentId` is a mutation *variable* rather than a hook argument because the
 * grade tables commit for an arbitrary row (the ManualCell the educator edited),
 * not for a single fixed student.
 *
 * Invalidates both the term-scoped list (`grades.list(classId, termId)`) and the
 * class-scoped list (`grades.list(classId, "")`), because the term grades page
 * mounts the former while the class grades page and its term switcher read the
 * latter.
 */
export const useSetManualScore = (classId: string, termId: string) => {
  return useMutationWithInvalidation(
    ({ studentId, ...dto }: ManualScoreDto & { studentId: string }) =>
      gradeApi.setManualScore(classId, termId, studentId, dto),
    {
      invalidateKeys: [
        queryKeys.educator.grades.list(classId, termId),
        queryKeys.educator.grades.list(classId, ''),
      ],
    },
  );
};

export const usePublishStudent = (classId: string) => {
  return useMutationWithInvalidation(
    ({ termId, studentId }: { termId: string; studentId: string }) =>
      gradeApi.publishStudent(classId, termId, studentId),
    { invalidateKeys: [queryKeys.educator.grades.list(classId, '')] },
  );
};

export const useUnlockStudent = (classId: string) => {
  return useMutationWithInvalidation(
    ({ termId, studentId }: { termId: string; studentId: string }) =>
      gradeApi.unlockStudent(classId, termId, studentId),
    { invalidateKeys: [queryKeys.educator.grades.list(classId, '')] },
  );
};

export const useAssessmentStatusOverride = (classId: string, termId: string) => {
  return useMutationWithInvalidation(
    ({
      studentId,
      assessmentId,
      overrideStatus,
    }: {
      studentId: string;
      assessmentId: string;
      overrideStatus: "MISSING" | "EXEMPTED" | null;
    }): Promise<AssessmentStatusOverrideResult | { deleted: number }> =>
      overrideStatus === null
        ? gradeApi.deleteAssessmentStatusOverride(classId, studentId, assessmentId)
        : gradeApi.setAssessmentStatusOverride(classId, studentId, assessmentId, {
            overrideStatus,
          }),
    {
      invalidateKeys: [
        queryKeys.educator.grades.list(classId, termId),
        queryKeys.educator.grades.list(classId, ''),
      ],
    },
  );
};

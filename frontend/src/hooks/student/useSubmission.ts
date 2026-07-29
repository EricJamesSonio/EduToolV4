import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentSubmissionApi } from "@/api/student/submission.api";

export const useStartSubmission = () => {
  return useMutationWithInvalidation(
    (assessmentId: string) => studentSubmissionApi.start(assessmentId),
    { invalidateKeys: [] },
  );
};

export const useSaveDraft = () => {
  return useMutationWithInvalidation(
    ({ assessmentId, answers }: { assessmentId: string; answers: { questionId: string; answer: string }[] }) =>
      studentSubmissionApi.saveDraft(assessmentId, { answers }),
    { invalidateKeys: [] },
  );
};

export const useFinishSubmission = () => {
  return useMutationWithInvalidation(
    ({ assessmentId, answers }: { assessmentId: string; answers: { questionId: string; answer: string }[] }) =>
      studentSubmissionApi.finish(assessmentId, { answers }),
    { invalidateKeys: [] },
  );
};

export const useSubmissionAnswers = (assessmentId: string, submissionId: string) => {
  return useAsyncQuery(
    [...queryKeys.student.submissions.all, assessmentId, submissionId] as const,
    () => studentSubmissionApi.getOwn(assessmentId, submissionId),
    { enabled: !!assessmentId && !!submissionId },
  );
};

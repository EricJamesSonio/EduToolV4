import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { submissionApi, SubmissionAnswerDetail } from "@/api/educator/submission.api";
import type { Submission } from "@/types/educator/submission.types";

export const useSubmissions = (classId: string, assessmentId: string) => {
  return useAsyncQuery<Submission[]>(
    [...queryKeys.educator.submissions.all, classId, assessmentId] as const,
    () => submissionApi.getSubmissions(classId, assessmentId),
    { enabled: !!classId && !!assessmentId },
  );
};

export const useSubmissionAnswers = (assessmentId: string, submissionId: string) => {
  return useAsyncQuery<SubmissionAnswerDetail[]>(
    [...queryKeys.educator.submissions.all, 'answers', assessmentId, submissionId] as const,
    () => submissionApi.getAnswers(assessmentId, submissionId),
    { enabled: !!assessmentId && !!submissionId },
  );
};

export const useUpdateSubmissionStatus = (classId: string, assessmentId: string) => {
  return useMutationWithInvalidation<
    Submission,
    unknown,
    { submissionId: string; status: "exempted" | "custom" | "missed"; manualScore?: number }
  >(
    ({ submissionId, status, manualScore }) =>
      submissionApi.updateStatus(classId, assessmentId, submissionId, status, manualScore),
    { invalidateKeys: [[...queryKeys.educator.submissions.all, classId, assessmentId] as const] },
  );
};

export const useGradeEssay = (classId: string, assessmentId: string) => {
  return useMutationWithInvalidation<
    Submission,
    unknown,
    { submissionId: string; score: number }
  >(
    ({ submissionId, score }) =>
      submissionApi.gradeEssay(classId, assessmentId, submissionId, score),
    { invalidateKeys: [[...queryKeys.educator.submissions.all, classId, assessmentId] as const] },
  );
};

import { useMutation, useQuery } from "@tanstack/react-query";
import { studentSubmissionApi } from "@/api/student/submission.api";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

export const useStartSubmission = () => {
  const standardOptions = createStandardMutationOptions({
    entity: "Submission",
    operation: "create",
  });

  return useMutation({
    mutationFn: (assessmentId: string) =>
      studentSubmissionApi.start(assessmentId),
    onSuccess: (data) => {
      standardOptions.onSuccess?.(data);
    },
    onError: standardOptions.onError,
  });
};

export const useSaveDraft = () => {
  const standardOptions = createStandardMutationOptions({
    entity: "Submission",
    operation: "update",
  });

  return useMutation({
    mutationFn: ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: { questionId: string; answer: string }[];
    }) =>
      studentSubmissionApi.saveDraft(assessmentId, { answers }),
    onSuccess: (data) => {
      standardOptions.onSuccess?.(data);
    },
    onError: standardOptions.onError,
  });
};

export const useFinishSubmission = () => {
  const standardOptions = createStandardMutationOptions({
    entity: "Submission",
    operation: "update",
  });

  return useMutation({
    mutationFn: ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: { questionId: string; answer: string }[];
    }) =>
      studentSubmissionApi.finish(assessmentId, { answers }),
    onSuccess: (data) => {
      standardOptions.onSuccess?.(data);
    },
    onError: standardOptions.onError,
  });
};

export const useSubmissionAnswers = (
  assessmentId: string,
  submissionId: string
) => {
  return useQuery({
    queryKey: [
      "student",
      "submission",
      assessmentId,
      submissionId,
    ],
    queryFn: () =>
      studentSubmissionApi.getOwn(assessmentId, submissionId),
    enabled: !!assessmentId && !!submissionId,
    ...QUERY_CONFIGS.detail,
  });
};
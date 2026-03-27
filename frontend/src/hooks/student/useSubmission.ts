import { useMutation, useQuery } from "@tanstack/react-query";
import { studentSubmissionApi } from "@/api/student/submission.api";

export const useStartSubmission = () => {
  return useMutation({
    mutationFn: (assessmentId: string) =>
      studentSubmissionApi.start(assessmentId),
  });
};

export const useSaveDraft = () => {
  return useMutation({
    mutationFn: ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: { questionId: string; answer: string }[];
    }) =>
      studentSubmissionApi.saveDraft(assessmentId, { answers }),
  });
};

export const useFinishSubmission = () => {
  return useMutation({
    mutationFn: ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: { questionId: string; answer: string }[];
    }) =>
      studentSubmissionApi.finish(assessmentId, { answers }),
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
  });
};
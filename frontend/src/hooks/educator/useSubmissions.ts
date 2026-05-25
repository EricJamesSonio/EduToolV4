// src/hooks/educator/useSubmissions.ts
import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { submissionApi, SubmissionAnswerDetail } from "@/api/educator/submission.api";
import type { Submission } from "@/types/educator/submission.types";

const SUBMISSIONS_KEY = "submissions";

export const useSubmissions = (
  classId: string,
  assessmentId: string
): UseQueryResult<Submission[], unknown> => {
  return useQuery<Submission[]>({
    queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
    queryFn: () => submissionApi.getSubmissions(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useSubmissionAnswers = (
  assessmentId: string,
  submissionId: string
): UseQueryResult<SubmissionAnswerDetail[], unknown> => {
  return useQuery<SubmissionAnswerDetail[]>({
    queryKey: ["submission-answers", assessmentId, submissionId],
    queryFn: () => submissionApi.getAnswers(assessmentId, submissionId),
    enabled: !!assessmentId && !!submissionId,
  });
};

export const useUpdateSubmissionStatus = (
  classId: string,
  assessmentId: string
): UseMutationResult<
  Submission,
  unknown,
  { submissionId: string; status: "exempted" | "custom" | "missed"; manualScore?: number }
> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, status, manualScore }) =>
      submissionApi.updateStatus(classId, assessmentId, submissionId, status, manualScore),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
      });
    },
  });
};

export const useGradeEssay = (
  classId: string,
  assessmentId: string
): UseMutationResult<
  Submission,
  unknown,
  { submissionId: string; score: number }
> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, score }) =>
      submissionApi.gradeEssay(classId, assessmentId, submissionId, score),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
      });
    },
  });
};
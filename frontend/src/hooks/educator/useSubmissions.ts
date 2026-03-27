// src/hooks/educator/useSubmissions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/api/educator/submission.api";

const SUBMISSIONS_KEY = "submissions";

export const useSubmissions = (
  classId: string,
  assessmentId: string
) => {
  return useQuery({
    queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
    queryFn: () =>
      submissionApi.getSubmissions(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useSubmissionAnswers = (
  assessmentId: string,
  submissionId: string
) => {
  return useQuery({
    queryKey: ["submission-answers", assessmentId, submissionId],
    queryFn: () =>
      submissionApi.getAnswers(assessmentId, submissionId),
    enabled: !!assessmentId && !!submissionId,
  });
};

export const useUpdateSubmissionStatus = (classId: string, assessmentId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      status,
      manualScore,
    }: {
      submissionId: string;
      status: "exempted" | "custom";
      manualScore?: number;
    }) =>
      submissionApi.updateStatus(
        classId,
        assessmentId,
        submissionId,
        status,
        manualScore
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
      });
    },
  });
};

export const useGradeEssay = (classId: string, assessmentId: string) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      score,
    }: {
      submissionId: string;
      score: number;
    }) =>
      submissionApi.gradeEssay(
        classId,
        assessmentId,
        submissionId,
        score
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
      });
    },
  });
};
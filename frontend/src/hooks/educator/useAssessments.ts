// filepath: frontend/src/hooks/educator/useAssessments.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult, Query
} from "@tanstack/react-query";
import {
  assessmentApi,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  UpdateQuestionRequest,
  GradeEssayRequest,
  UpdateSubmissionStatusRequest,
} from "@/api/educator/assessment.api";
import type { Assessment, Question } from "@/types/educator/assessment.types";
import type { Submission } from "@/types/educator/submission.types";

const ASSESSMENTS_KEY = "assessments";
const SUBMISSIONS_KEY = "submissions";

export const useAssessments = (
  classId: string,
  filters?: { termId?: string; type?: string },
): UseQueryResult<Assessment[], Error> => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId, filters],
    queryFn: () => assessmentApi.getAll(classId, filters),
    enabled: !!classId,
  });
};

export const useAssessment = (
  classId: string,
  assessmentId: string,
  options?: {
  refetchInterval?: number | false | ((query: Query<Assessment, Error>) => number | false);
},
): UseQueryResult<Assessment, Error> => {
  return useQuery({
    queryKey: [ASSESSMENTS_KEY, classId, assessmentId],
    queryFn: () => assessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
    refetchInterval: options?.refetchInterval,
  });
};

export const useCreateAssessment = (
  classId: string,
): UseMutationResult<Assessment, Error, CreateAssessmentRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssessmentRequest) => assessmentApi.create(classId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUpdateAssessment = (
  classId: string,
): UseMutationResult<Assessment, Error, { assessmentId: string; data: UpdateAssessmentRequest }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, data }) => assessmentApi.update(classId, assessmentId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId, vars.assessmentId] });
    },
  });
};

export const useDeleteAssessment = (
  classId: string,
): UseMutationResult<void, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.delete(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUpdateQuestion = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Question, Error, { questionId: string; data: UpdateQuestionRequest }> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, data }) =>
      assessmentApi.updateQuestion(classId, assessmentId, questionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId, assessmentId] });
    },
  });
};

export const useAssessmentSubmissions = (
  classId: string,
  assessmentId: string,
): UseQueryResult<Submission[], Error> => {
  return useQuery({
    queryKey: [SUBMISSIONS_KEY, classId, assessmentId],
    queryFn: () => assessmentApi.getSubmissions(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
  });
};

export const useUpdateSubmissionStatus = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Submission, Error, { submissionId: string } & UpdateSubmissionStatusRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, ...body }) =>
      assessmentApi.updateSubmissionStatus(classId, assessmentId, submissionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUBMISSIONS_KEY, classId, assessmentId] });
    },
  });
};

export const useGradeEssay = (
  classId: string,
  assessmentId: string,
): UseMutationResult<Submission, Error, { submissionId: string } & GradeEssayRequest> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, ...body }) =>
      assessmentApi.gradeEssay(classId, assessmentId, submissionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SUBMISSIONS_KEY, classId, assessmentId] });
    },
  });
};

export const usePublishAssessment = (
  classId: string,
): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.publish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};

export const useUnpublishAssessment = (
  classId: string,
): UseMutationResult<{ success: true }, Error, string> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assessmentId: string) => assessmentApi.unpublish(classId, assessmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSESSMENTS_KEY, classId] });
    },
  });
};
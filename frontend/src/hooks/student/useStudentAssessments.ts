import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { studentAssessmentApi } from "@/api/student/assessment.api";
import { QUERY_CONFIGS } from "@/lib/query-client";

import type {
  StudentAssessmentItem,
  StudentAssessmentDetail,
  AssessmentResult,
} from "@/api/student/assessment.api";

// 🔹 Get all assessments
export const useStudentAssessments = (
  classId: string
): UseQueryResult<StudentAssessmentItem[], Error> => {
  return useQuery({
    queryKey: ["student", "assessments", classId],
    queryFn: () => studentAssessmentApi.getAll(classId),
    enabled: !!classId,
    ...QUERY_CONFIGS.list,
  });
};

// 🔹 Get single assessment
export const useStudentAssessment = (
  classId: string,
  assessmentId: string
): UseQueryResult<StudentAssessmentDetail, Error> => {
  return useQuery({
    queryKey: ["student", "assessment", classId, assessmentId],
    queryFn: () =>
      studentAssessmentApi.getOne(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
    ...QUERY_CONFIGS.detail,
  });
};

// 🔹 Get result
export const useAssessmentResult = (
  classId: string,
  assessmentId: string
): UseQueryResult<AssessmentResult, Error> => {
  return useQuery({
    queryKey: ["student", "assessment", "result", classId, assessmentId],
    queryFn: () =>
      studentAssessmentApi.getResult(classId, assessmentId),
    enabled: !!classId && !!assessmentId,
    ...QUERY_CONFIGS.detail,
  });
};
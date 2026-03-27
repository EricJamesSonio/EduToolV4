import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { studentAssessmentApi } from "@/api/student/assessment.api";

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
  });
};